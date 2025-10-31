import os
import warnings
from typing import List, Dict, Optional
import requests
from xml.etree import ElementTree as ET
from dataclasses import dataclass
import chromadb
from chromadb.config import Settings
from datetime import datetime
from dotenv import load_dotenv

# Suppress warnings from Google Cloud libraries (gRPC, ALTS, etc.)
os.environ['GRPC_PYTHON_LOG_LEVEL'] = 'ERROR'
os.environ['GRPC_VERBOSITY'] = 'ERROR'
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', message='.*ALTS creds ignored.*')

# Load environment variables from .env file
load_dotenv()

# Import google.generativeai after setting environment variables
import google.generativeai as genai

@dataclass
class PubMedArticle:
    """Class để lưu trữ thông tin bài báo PubMed"""
    pmid: str
    title: str
    abstract: str
    authors: List[str]
    publication_date: str
    journal: str
    doi: Optional[str] = None
    
    def to_text(self) -> str:
        """Chuyển đổi article thành text để embedding"""
        return f"Title: {self.title}\n\nAbstract: {self.abstract}"


class PubMedFetcher:
    """Class để lấy dữ liệu từ PubMed API"""
    def __init__(self, email: str):
        self.base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
        self.email = email
        
    def search(self, query: str, max_results: int = 100) -> List[str]:
        """
        Tìm kiếm bài báo trên PubMed
        Args:
            query: Từ khóa tìm kiếm (ví dụ: "diabetes treatment")
            max_results: Số lượng kết quả tối đa
            
        Returns:
            List các PMID (PubMed ID)
        """
        search_url = f"{self.base_url}esearch.fcgi"
        params = {
            'db': 'pubmed',
            'term': query,
            'retmax': max_results,
            'retmode': 'json',
            'email': self.email
        }
        
        try:
            print(f"Đang tìm kiếm trên PubMed với query: '{query}'...")
            response = requests.get(search_url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            pmids = data.get('esearchresult', {}).get('idlist', [])
            total_found = data.get('esearchresult', {}).get('count', '0')
            print(f"Tìm thấy {len(pmids)} bài báo (tổng {total_found}) cho query: '{query}'")
            
            if not pmids:
                print(" Không có PMID nào được trả về. Kiểm tra lại query hoặc thử query khác.")
            
            return pmids
        except requests.exceptions.Timeout:
            print(f" Timeout khi tìm kiếm trên PubMed")
            return []
        except requests.exceptions.RequestException as e:
            print(f"Lỗi kết nối khi tìm kiếm: {e}")
            return []
        except Exception as e:
            print(f"Lỗi khi tìm kiếm: {e}")
            print(f"Response content: {response.text[:500] if 'response' in locals() else 'N/A'}")
            return []
    
    def fetch_articles(self, pmids: List[str]) -> List[PubMedArticle]:
        """
        Lấy thông tin chi tiết của các bài báo
        
        Args:
            pmids: List các PubMed ID
            
        Returns:
            List các PubMedArticle objects
        """
        if not pmids:
            print(" Không có PMID nào để fetch")
            return []
        
        print(f"Đang fetch {len(pmids)} bài báo từ PubMed...")
            
        fetch_url = f"{self.base_url}efetch.fcgi"
        params = {
            'db': 'pubmed',
            'id': ','.join(pmids),
            'retmode': 'xml',
            'email': self.email
        }
        
        try:
            response = requests.get(fetch_url, params=params, timeout=60)
            response.raise_for_status()
            
            if not response.content:
                print(" Response rỗng từ PubMed API")
                return []
            
            articles = self._parse_xml(response.content)
            print(f"Fetch thành công {len(articles)}/{len(pmids)} bài báo")
            return articles
        except requests.exceptions.Timeout:
            print(f" Timeout khi fetch dữ liệu từ PubMed")
            return []
        except requests.exceptions.RequestException as e:
            print(f"Lỗi kết nối khi fetch dữ liệu: {e}")
            return []
        except Exception as e:
            print(f"Lỗi khi lấy dữ liệu: {e}")
            print(f"Response status: {response.status_code if 'response' in locals() else 'N/A'}")
            print(f"Response length: {len(response.content) if 'response' in locals() and response.content else 0} bytes")
            return []
    
    def _parse_xml(self, xml_content: bytes) -> List[PubMedArticle]:
        """Parse XML response từ PubMed"""
        articles = []
        try:
            root = ET.fromstring(xml_content)
        except ET.ParseError as e:
            print(f"Lỗi parse XML: {e}")
            print(f"XML content preview: {xml_content[:500]}")
            return []
        
        # Handle XML namespace
        namespaces = {'': 'http://www.ncbi.nlm.nih.gov'}
        
        pubmed_articles = root.findall('.//PubmedArticle')
        if not pubmed_articles:
            # Try without namespace
            pubmed_articles = root.findall('.//PubmedArticle')
        
        print(f"Đang parse {len(pubmed_articles)} bài báo từ XML...")
        
        for article_elem in pubmed_articles:
            try:
                # PMID
                pmid_elem = article_elem.find('.//PMID')
                if pmid_elem is None or pmid_elem.text is None:
                    print(" Bỏ qua bài báo không có PMID")
                    continue
                pmid = pmid_elem.text.strip()
                
                # Title
                title_elem = article_elem.find('.//ArticleTitle')
                title = title_elem.text.strip() if title_elem is not None and title_elem.text else "No title"
                
                # Abstract - handle multiple AbstractText elements and their Label attribute
                abstract_parts = []
                for abstract_elem in article_elem.findall('.//AbstractText'):
                    if abstract_elem.text:
                        label = abstract_elem.get('Label', '')
                        text = abstract_elem.text.strip()
                        if label:
                            abstract_parts.append(f"{label}: {text}")
                        else:
                            abstract_parts.append(text)
                    # Also check for nested text in AbstractText
                    for sub_elem in abstract_elem:
                        if sub_elem.text:
                            abstract_parts.append(sub_elem.text.strip())
                
                abstract = ' '.join(abstract_parts) if abstract_parts else "No abstract available"
                
                # Authors - handle multiple formats
                authors = []
                for author in article_elem.findall('.//Author'):
                    lastname_elem = author.find('LastName')
                    forename_elem = author.find('ForeName')
                    initials_elem = author.find('Initials')
                    
                    if lastname_elem is not None and lastname_elem.text:
                        lastname = lastname_elem.text.strip()
                        if forename_elem is not None and forename_elem.text:
                            forename = forename_elem.text.strip()
                            authors.append(f"{forename} {lastname}")
                        elif initials_elem is not None and initials_elem.text:
                            initials = initials_elem.text.strip()
                            authors.append(f"{initials} {lastname}")
                        else:
                            authors.append(lastname)
                
                # Publication date - handle multiple date formats
                pub_date = article_elem.find('.//PubDate')
                if pub_date is not None:
                    year_elem = pub_date.find('Year')
                    month_elem = pub_date.find('Month')
                    day_elem = pub_date.find('Day')
                    
                    date_parts = []
                    if year_elem is not None and year_elem.text:
                        date_parts.append(year_elem.text.strip())
                    if month_elem is not None and month_elem.text:
                        month_val = month_elem.text.strip()
                        date_parts.append(month_val.zfill(2) if month_val.isdigit() else month_val)
                    if day_elem is not None and day_elem.text:
                        date_parts.append(day_elem.text.strip().zfill(2))
                    publication_date = '-'.join(date_parts) if date_parts else "Unknown"
                else:
                    # Try alternative date location
                    medline_date = article_elem.find('.//MedlineDate')
                    publication_date = medline_date.text.strip() if medline_date is not None and medline_date.text else "Unknown"
                
                # Journal
                journal_elem = article_elem.find('.//Journal/Title')
                journal = journal_elem.text.strip() if journal_elem is not None and journal_elem.text else "Unknown"
                
                # DOI
                doi_elem = article_elem.find('.//ArticleId[@IdType="doi"]')
                if doi_elem is None:
                    # Try alternative DOI location
                    doi_elem = article_elem.find('.//ELocationID[@EIdType="doi"]')
                doi = doi_elem.text.strip() if doi_elem is not None and doi_elem.text else None
                
                # Validate required fields
                if not pmid:
                    print(f" Bỏ qua bài báo không có PMID hợp lệ")
                    continue
                
                article = PubMedArticle(
                    pmid=pmid,
                    title=title,
                    abstract=abstract,
                    authors=authors,
                    publication_date=publication_date,
                    journal=journal,
                    doi=doi
                )
                articles.append(article)
                
            except Exception as e:
                print(f"Lỗi khi parse bài báo (PMID có thể: {pmid if 'pmid' in locals() else 'unknown'}): {e}")
                import traceback
                traceback.print_exc()
                continue
        
        print(f"Parse thành công {len(articles)} bài báo")
        return articles


class VectorDatabase:
    def __init__(self, collection_name: str = "pubmed_articles", 
                 chroma_host: str = "localhost",
                 chroma_port: int = 7000,
                 gemini_api_key: Optional[str] = None,
                 embedding_model: str = "text-embedding-004"):

        try:
            self.client = chromadb.HttpClient(
                host=chroma_host,
                port=chroma_port
            )
            print(f"Đã kết nối đến ChromaDB tại {chroma_host}:{chroma_port}")
        except Exception as e:
            print(f"Lỗi khi kết nối đến ChromaDB: {e}")
            print(f"Đảm bảo ChromaDB container đang chạy: docker-compose up -d")
            raise
        
        # Setup Gemini API
        self.api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "Gemini API key is required. "
                "Set GEMINI_API_KEY environment variable or pass gemini_api_key parameter."
            )
        
        genai.configure(api_key=self.api_key)
        self.embedding_model_name = embedding_model
        
        print(f"Đã cấu hình Gemini embedding model: {embedding_model}")
        
        # Get or create collection
        try:
            self.collection = self.client.get_collection(collection_name)
            print(f"Đã load collection '{collection_name}' với {self.collection.count()} documents")
        except:
            self.collection = self.client.create_collection(
                name=collection_name,
                metadata={"description": "PubMed medical articles"}
            )
            print(f"Đã tạo collection mới: '{collection_name}'")
    
    def _get_embeddings(self, texts: List[str], task_type: str = "retrieval_document") -> List[List[float]]:
        try:
            result = genai.embed_content(
                model=f"models/{self.embedding_model_name}",
                content=texts,
                task_type=task_type
            )
            embeddings = result['embedding']
            if isinstance(embeddings[0], (int, float)):
                # Single embedding case
                return [embeddings]
            return embeddings
        except Exception as e:
            print(f"Lỗi khi tạo embeddings: {e}")
            raise
    
    def add_articles(self, articles: List[PubMedArticle], batch_size: int = 10):
        """
        Thêm bài báo vào vector database
        
        Args:
            articles: List các PubMedArticle
            batch_size: Số lượng articles xử lý mỗi batch
        """
        if not articles:
            print("Không có bài báo để thêm")
            return
        
        print(f"Đang thêm {len(articles)} bài báo vào database...")
        
        for i in range(0, len(articles), batch_size):
            batch = articles[i:i+batch_size]
            
            # Chuẩn bị dữ liệu
            documents = [article.to_text() for article in batch]
            ids = [article.pmid for article in batch]
            
            # Tạo embeddings sử dụng Gemini
            embeddings = self._get_embeddings(documents)
            
            # Metadata
            metadatas = [
                {
                    "title": article.title,
                    "authors": ", ".join(article.authors[:3]),  # Lưu 3 tác giả đầu
                    "publication_date": article.publication_date,
                    "journal": article.journal,
                    "doi": article.doi or "N/A"
                }
                for article in batch
            ]
            
            # Thêm vào collection
            self.collection.add(
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
            print(f"Đã thêm batch {i//batch_size + 1}/{(len(articles)-1)//batch_size + 1}")
        
        print(f"Hoàn thành! Tổng số documents trong database: {self.collection.count()}")
    
    def search(self, query: str, n_results: int = 5) -> Dict:
        """
        Tìm kiếm bài báo liên quan
        
        Args:
            query: Câu hỏi/query từ người dùng
            n_results: Số lượng kết quả trả về
            
        Returns:
            Dictionary chứa kết quả tìm kiếm
        """
        # Tạo embedding cho query sử dụng Gemini (với task_type retrieval_query)
        query_embedding = self._get_embeddings([query], task_type="retrieval_query")
        
        # Search trong vector database
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=n_results
        )
        
        return results
    
    def clear_collection(self):
        """Xóa toàn bộ dữ liệu trong collection"""
        self.client.delete_collection(self.collection.name)
        print(f"Đã xóa collection '{self.collection.name}'")


class MedicalRAG:
    """
    Hệ thống RAG hoàn chỉnh cho y tế
    Kết hợp PubMed fetcher và Vector Database
    """
    
    def __init__(self, email: str = "your_email@example.com", 
                 gemini_api_key: Optional[str] = None,
                 chroma_host: str = "localhost",
                 chroma_port: int = 7000):
        """
        Khởi tạo RAG system
        
        Args:
            email: Email để sử dụng PubMed API
            gemini_api_key: Google Gemini API key (nếu None sẽ lấy từ env GEMINI_API_KEY)
            chroma_host: Host của ChromaDB server (mặc định: localhost)
            chroma_port: Port của ChromaDB server (mặc định: 7000)
        """
        self.pubmed = PubMedFetcher(email=email)
        self.vectordb = VectorDatabase(
            gemini_api_key=gemini_api_key,
            chroma_host=chroma_host,
            chroma_port=chroma_port
        )
        print("Đã khởi tạo Medical RAG System")
    
    def index_topic(self, query: str, max_results: int = 50):
        """
        Lấy và index các bài báo về một chủ đề
        
        Args:
            query: Chủ đề tìm kiếm (ví dụ: "COVID-19 treatment")
            max_results: Số lượng bài báo tối đa
        """
        print(f"\n{'='*60}")
        print(f"Đang index chủ đề: '{query}'")
        print(f"{'='*60}\n")
        
        # Tìm kiếm PMIDs
        pmids = self.pubmed.search(query, max_results=max_results)
        
        if not pmids:
            print("Không tìm thấy bài báo nào. Hãy thử query khác hoặc kiểm tra kết nối internet.")
            return
        
        # Lấy thông tin chi tiết
        articles = self.pubmed.fetch_articles(pmids)
        
        if not articles:
            print("Không lấy được thông tin bài báo từ PubMed. Có thể do:")
            print("   - Lỗi kết nối mạng")
            print("   - Lỗi parse XML từ PubMed")
            print("   - Bài báo không có đủ thông tin (abstract, title, etc.)")
            return
        
        print(f"\nĐang index {len(articles)} bài báo vào vector database...")
        
        # Thêm vào vector database
        try:
            self.vectordb.add_articles(articles)
            print(f"\nĐã index thành công {len(articles)} bài báo về '{query}'")
        except Exception as e:
            print(f"\nLỗi khi index vào vector database: {e}")
            import traceback
            traceback.print_exc()
    
    def query(self, question: str, n_results: int = 3, auto_fetch: bool = True, auto_fetch_count: int = 30) -> str:
        """
        Trả lời câu hỏi dựa trên knowledge base
        
        Args:
            question: Câu hỏi từ người dùng
            n_results: Số lượng bài báo liên quan để tham khảo
            auto_fetch: Tự động fetch dữ liệu từ PubMed nếu database trống (mặc định: True)
            auto_fetch_count: Số lượng bài báo fetch tự động nếu database trống (mặc định: 30)
            
        Returns:
            Câu trả lời với context từ các bài báo
        """
        print(f"\n{'='*60}")
        print(f"Câu hỏi: {question}")
        print(f"{'='*60}\n")
        
        # Kiểm tra xem database có dữ liệu không
        try:
            db_count = self.vectordb.collection.count()
        except:
            db_count = 0
        
        if db_count > 0:
            print(f"Database hiện có {db_count} bài báo")
        else:
            print("Database đang trống")
        
        # Nếu database trống và auto_fetch = True, tự động index dữ liệu
        if db_count == 0 and auto_fetch:
            print("\n Database đang trống. Đang tự động crawl dữ liệu từ PubMed...")
            print(f"Đang tìm kiếm và index {auto_fetch_count} bài báo liên quan đến: '{question}'")
            print("-" * 60)
            try:
                self.index_topic(question, max_results=auto_fetch_count)
                print("-" * 60)
                print("Đã hoàn thành index dữ liệu. Đang thực hiện tìm kiếm...\n")
            except Exception as e:
                print(f" Không thể tự động fetch dữ liệu: {e}")
                print("Bạn có thể thử index thủ công bằng option 1 trong menu.\n")
        
        # Tìm kiếm trong vector database
        results = self.vectordb.search(question, n_results=n_results)
        
        if not results['documents'][0]:
            if db_count == 0:
                return ("Không tìm thấy thông tin liên quan.\n"
                       "Đã cố gắng crawl dữ liệu từ PubMed nhưng không tìm thấy bài báo nào "
                       f"liên quan đến: '{question}'\n"
                       "Vui lòng thử query khác hoặc index thủ công bằng option 1.")
            else:
                return "Không tìm thấy thông tin liên quan trong database."
        
        # Format câu trả lời
        response = "Dựa trên các nghiên cứu y học, tôi tìm thấy:\n\n"
        
        for i, (doc, metadata, distance) in enumerate(zip(
            results['documents'][0],
            results['metadatas'][0],
            results['distances'][0]
        ), 1):
            response += f"   Nguồn {i}: {metadata['title']}\n"
            response += f"   Tác giả: {metadata['authors']}\n"
            response += f"   Journal: {metadata['journal']} ({metadata['publication_date']})\n"
            response += f"   Độ liên quan: {1 - distance:.2%}\n"
            
            # Trích xuất abstract (giới hạn độ dài)
            abstract = doc.split("Abstract: ")[1] if "Abstract: " in doc else doc
            if len(abstract) > 300:
                abstract = abstract[:300] + "..."
            response += f"   {abstract}\n\n"
        
        response += "\nLưu ý: Đây là thông tin từ các nghiên cứu khoa học. "
        response += "Vui lòng tham khảo ý kiến bác sĩ cho tình huống cụ thể của bạn."
        
        return response
    
    def get_stats(self) -> Dict:
        """Lấy thống kê về database"""
        count = self.vectordb.collection.count()
        return {
            "total_articles": count,
            "collection_name": self.vectordb.collection.name
        }
    
    def clear_database(self) -> bool:
        """
        Xóa toàn bộ dữ liệu trong database
        
        Returns:
            True nếu xóa thành công, False nếu có lỗi
        """
        try:
            count_before = self.vectordb.collection.count()
            collection_name = self.vectordb.collection.name
            
            print(f"\n{'='*60}")
            print(f" CẢNH BÁO: XÓA TOÀN BỘ DỮ LIỆU")
            print(f"{'='*60}")
            print(f"Collection: {collection_name}")
            print(f"Số lượng bài báo sẽ bị xóa: {count_before}")
            print(f"{'='*60}")
            
            confirm = input("\nBạn có chắc chắn muốn xóa toàn bộ dữ liệu? (yes/no): ").strip().lower()
            
            if confirm not in ['yes', 'y']:
                print("Đã hủy thao tác xóa dữ liệu.")
                return False
            
            self.vectordb.clear_collection()
            
            # Tạo lại collection trống
            self.vectordb.collection = self.vectordb.client.create_collection(
                name=collection_name,
                metadata={"description": "PubMed medical articles"}
            )
            
            print(f"Đã xóa thành công {count_before} bài báo khỏi collection '{collection_name}'")
            print(f"Đã tạo lại collection trống: '{collection_name}'")
            return True
            
        except Exception as e:
            print(f"Lỗi khi xóa database: {e}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Hàm main để demo hệ thống"""
    
    print("\n" + "="*60)
    print("MEDICAL RAG SYSTEM - HỆ THỐNG TRẢ LỜI Y TẾ")
    print("="*60 + "\n")
    
    # init rag
    rag = MedicalRAG(email="nguyentienthuan9595@gmail.com") 
    
    topics = [
        "diabetes mellitus treatment",
        "hypertension management",
    ]
    
    print("Bạn muốn:")
    print("1. Index dữ liệu mới từ PubMed")
    print("2. Truy vấn dữ liệu đã có")
    print("3. Xem thống kê database")
    print("4. Xóa toàn bộ dữ liệu trong ChromaDB")
    
    choice = input("\nChọn (1/2/3/4): ").strip()
    
    if choice == "1":
        topic = input("\nNhập chủ đề cần index (ví dụ: 'COVID-19 vaccine'): ").strip()
        max_results = int(input("Số lượng bài báo (khuyến nghị 20-50): ").strip() or "30")
        rag.index_topic(topic, max_results=max_results)
        
    elif choice == "2":
        question = input("\nNhập câu hỏi của bạn: ").strip()
        answer = rag.query(question, n_results=3)
        print("\n" + answer)
        
    elif choice == "3":
        stats = rag.get_stats()
        print(f"\nThống kê Database:")
        print(f"   - Tổng số bài báo: {stats['total_articles']}")
        print(f"   - Collection: {stats['collection_name']}")
    
    elif choice == "4":
        rag.clear_database()
    
    else:
        print("Lựa chọn không hợp lệ. Vui lòng chọn 1, 2, 3 hoặc 4.")
    
    print("\n" + "="*60)
    print("Hoàn thành!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()