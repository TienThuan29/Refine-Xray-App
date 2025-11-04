using UglyToad.PdfPig;
using Xceed.Words.NET;

namespace AdminService.Utils
{
    public class MarkDownConverter
    {
        /// <summary>
        /// Converts a Word document (.docx) to markdown string
        /// </summary>
        /// <param name="filePath">Path to the .docx file</param>
        /// <returns>Markdown formatted string</returns>
        public static string ConvertDocxToMarkdown(string filePath)
        {
            try
            {
                using var document = DocX.Load(filePath);
                var markdown = new System.Text.StringBuilder();
                
                // Process paragraphs
                foreach (var paragraph in document.Paragraphs)
                {
                    if (paragraph.Text.Trim().Length == 0)
                    {
                        markdown.AppendLine();
                        continue;
                    }

                    var text = paragraph.Text;
                    markdown.AppendLine(text);
                }

                // Process tables
                foreach (var table in document.Tables)
                {
                    markdown.AppendLine();
                    foreach (var row in table.Rows)
                    {
                        var cells = row.Cells.Select(c => c.Paragraphs.FirstOrDefault()?.Text ?? "").ToList();
                        markdown.AppendLine("| " + string.Join(" | ", cells) + " |");
                        
                        // Add header separator after first row
                        if (table.Rows.IndexOf(row) == 0)
                        {
                            markdown.AppendLine("| " + string.Join(" | ", cells.Select(_ => "---")) + " |");
                        }
                    }
                    markdown.AppendLine();
                }

                return markdown.ToString().Trim();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Error converting DOCX to Markdown: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Converts a Word document (.docx) from byte array to markdown string
        /// </summary>
        /// <param name="fileBytes">Byte array of the .docx file</param>
        /// <returns>Markdown formatted string</returns>
        public static string ConvertDocxToMarkdown(byte[] fileBytes)
        {
            var tempFile = Path.GetTempFileName() + ".docx";
            try
            {
                File.WriteAllBytes(tempFile, fileBytes);
                return ConvertDocxToMarkdown(tempFile);
            }
            finally
            {
                if (File.Exists(tempFile))
                {
                    File.Delete(tempFile);
                }
            }
        }

        /// <summary>
        /// Converts a PDF document to markdown string
        /// </summary>
        /// <param name="filePath">Path to the .pdf file</param>
        /// <returns>Markdown formatted string</returns>
        public static string ConvertPdfToMarkdown(string filePath)
        {
            try
            {
                var markdown = new System.Text.StringBuilder();
                
                using var document = PdfDocument.Open(filePath);
                
                foreach (var page in document.GetPages())
                {
                    var text = page.Text;
                    
                    // Clean up text and add to markdown
                    var lines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                        .Where(line => !string.IsNullOrWhiteSpace(line))
                        .ToList();
                    
                    foreach (var line in lines)
                    {
                        markdown.AppendLine(line.Trim());
                    }
                    
                    markdown.AppendLine();
                }
                
                return markdown.ToString().Trim();
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Error converting PDF to Markdown: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Converts a PDF document from byte array to markdown string
        /// </summary>
        /// <param name="fileBytes">Byte array of the .pdf file</param>
        /// <returns>Markdown formatted string</returns>
        public static string ConvertPdfToMarkdown(byte[] fileBytes)
        {
            var tempFile = Path.GetTempFileName() + ".pdf";
            try
            {
                File.WriteAllBytes(tempFile, fileBytes);
                return ConvertPdfToMarkdown(tempFile);
            }
            finally
            {
                if (File.Exists(tempFile))
                {
                    File.Delete(tempFile);
                }
            }
        }

        /// <summary>
        /// Automatically detects file type and converts to markdown based on file extension
        /// </summary>
        /// <param name="fileBytes">Byte array of the file</param>
        /// <param name="fileName">Name of the file (used to determine file type)</param>
        /// <returns>Markdown formatted string</returns>
        public static string ConvertToMarkdown(byte[] fileBytes, string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            
            return extension switch
            {
                ".docx" => ConvertDocxToMarkdown(fileBytes),
                ".pdf" => ConvertPdfToMarkdown(fileBytes),
                ".doc" => throw new NotSupportedException(".doc format is not supported. Please use .docx instead."),
                _ => throw new NotSupportedException($"File format '{extension}' is not supported. Supported formats: .docx, .pdf")
            };
        }

        /// <summary>
        /// Automatically detects file type and converts to markdown based on file path
        /// </summary>
        /// <param name="filePath">Path to the file</param>
        /// <returns>Markdown formatted string</returns>
        public static string ConvertToMarkdown(string filePath)
        {
            var extension = Path.GetExtension(filePath).ToLowerInvariant();
            
            return extension switch
            {
                ".docx" => ConvertDocxToMarkdown(filePath),
                ".pdf" => ConvertPdfToMarkdown(filePath),
                ".doc" => throw new NotSupportedException(".doc format is not supported. Please use .docx instead."),
                _ => throw new NotSupportedException($"File format '{extension}' is not supported. Supported formats: .docx, .pdf")
            };
        }
    }
}
