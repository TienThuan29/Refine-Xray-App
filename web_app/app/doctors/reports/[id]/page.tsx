'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Spin, Typography, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { ChatSession } from '@/types/chatsession';
import { GradcamImage } from '@/services/gemini';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';

const { Title } = Typography;

interface ReportData {
  chatSessionId: string;
  templateId: string;
  templateName: string;
  reportContent: string;
  gradcamImages?: GradcamImage[];
  chatSession: ChatSession;
  createdAt: string;
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get report data from sessionStorage
    const storedReport = sessionStorage.getItem('generatedReport');
    
    if (storedReport) {
      try {
        const data = JSON.parse(storedReport);
        // Verify the chatSessionId matches
        if (data.chatSessionId === params.id) {
          setReportData(data);
        } else {
          message.error('Report data mismatch');
          router.push('/doctors');
        }
      } catch (error) {
        console.error('Error parsing report data:', error);
        message.error('Invalid report data');
        router.push('/doctors');
      }
    } else {
      message.error('Report not found');
      router.push('/doctors');
    }
    
    setLoading(false);
  }, [params.id, router]);

  const handleSaveReport = (updatedContent: string) => {
    if (!reportData) return;
    
    // Update report data with new content
    const updatedReportData = {
      ...reportData,
      reportContent: updatedContent,
      createdAt: new Date().toISOString(),
    };
    
    setReportData(updatedReportData);
    
    // Update sessionStorage
    sessionStorage.setItem('generatedReport', JSON.stringify(updatedReportData));
    
    toast.success('Report updated successfully!');
  };

  const handleDownload = () => {
    if (!reportData) return;

    const blob = new Blob([reportData.reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${reportData.chatSessionId}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between no-print">
          <div className="flex items-center space-x-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/doctors')}
            >
              Back
            </Button>
            <div>
              <Title level={2} className="mb-0">
                Medical Report
              </Title>
              <p className="text-gray-500 text-sm mt-1">
                Template: {reportData.templateName} | Generated: {new Date(reportData.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownload}
            >
              Download
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              Print
            </Button>
          </div>
        </div>

        {/* GradCAM Images Section */}
        {reportData.gradcamImages && reportData.gradcamImages.length > 0 && (
          <Card className="shadow-lg mb-6">
            <Title level={4} className="mb-4">
              GradCAM Analysis Heatmaps
            </Title>
            <p className="text-gray-600 mb-4 text-sm">
              The following heatmap images highlight the regions of the X-ray that the AI model identified as most significant for each predicted disease.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.gradcamImages.map((image, index) => (
                <div key={image.key} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    <img
                      src={image.url}
                      alt={`GradCAM heatmap for ${image.disease}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.error('Failed to load image:', image.url);
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="text-gray-400 text-sm p-4">Image not available</div>';
                        }
                      }}
                    />
                  </div>
                  <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{image.disease}</p>
                    <p className="text-xs text-gray-500 mt-1">GradCAM Heatmap</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Report Content */}
        <Card className="shadow-lg">
          <RichTextEditor
            content={reportData.reportContent}
            onSave={handleSaveReport}
            editable={true}
            minHeight={600}
            className="max-w-none"
          />
        </Card>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            .no-print {
              display: none;
            }
            body {
              background: white;
            }
            .ant-card {
              box-shadow: none;
              border: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

