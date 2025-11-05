'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, Button, Spin, Typography, message, Modal, Form, Input } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, PrinterOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { ChatSession } from '@/types/chatsession';
import { GradcamImage } from '@/services/gemini';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import useReportManagement from '@/hooks/useReportManagement';
import useChatSessionManager from '@/hooks/useChatSessionManager';
import useAxios from '@/hooks/useAxios';
import { Api } from '@/configs/api';
import { useAuth } from '@/contexts/AuthContext';

const { Title } = Typography;

interface ReportData {
  chatSessionId: string;
  templateId: string;
  templateName: string;
  reportContent: string;
  gradcamImages?: GradcamImage[];
  chatSession: ChatSession;
  createdAt: string;
  reportId?: string; // Track saved report ID
  isSent?: boolean; // Track if report has been sent
  sentDate?: string; // Date when report was sent
  patientReportId?: string; // ID of the PatientReport (for deletion)
  sentToEmail?: string; // Email the report was sent to
}

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();
  const reportManager = useReportManagement();
  const { getChatSession } = useChatSessionManager();
  const axios = useAxios();
  const { user } = useAuth();

  useEffect(() => {
    const loadReportData = async () => {
      const reportId = searchParams?.get('reportId');

      // If reportId is provided, load from backend
      if (reportId) {
        try {
          const report = await reportManager.getReport(reportId);
          if (!report) {
            message.error('Report not found');
            router.push('/doctors');
            return;
          }

          // Get chat session if we have chatSessionId
          let chatSession: ChatSession | null = null;
          if (report.chatSessionId) {
            chatSession = await getChatSession(report.chatSessionId);
          }

          // Create a minimal chat session if we couldn't fetch it
          // This allows viewing the report even if chat session is unavailable
          const fallbackChatSession: ChatSession = chatSession || {
            id: report.chatSessionId || params.id as string,
            title: 'Unknown Chat Session',
            isDeleted: false,
          } as ChatSession;

          // Convert backend report to ReportData format
          const data: ReportData = {
            chatSessionId: report.chatSessionId || params.id as string,
            templateId: report.templateId || '',
            templateName: report.title || 'Untitled Report',
            reportContent: report.content || '',
            chatSession: fallbackChatSession,
            createdAt: report.createdDate || new Date().toISOString(),
            reportId: report.id,
            isSent: report.isSent || false,
            sentDate: report.sentDate,
          };

          // If report is sent, try to find patientReportId from PatientReports
          if (report.isSent && report.patientEmail) {
            try {
              const patientReportsResponse = await axios.get(
                `${Api.PatientReport.GET_PATIENT_REPORTS_BY_EMAIL}/${encodeURIComponent(report.patientEmail)}`
              );
              if (patientReportsResponse.data?.success && patientReportsResponse.data?.dataResponse) {
                const patientReports = patientReportsResponse.data.dataResponse as Array<{ id: string; title?: string; content?: string }>;
                // Find matching report by title and content
                const matchingReport = patientReports.find((pr) => 
                  pr.title === report.title && 
                  pr.content === report.content
                );
                if (matchingReport) {
                  data.patientReportId = matchingReport.id;
                  data.sentToEmail = report.patientEmail;
                }
              }
            } catch (error) {
              console.warn('Could not fetch patient reports:', error);
            }
          }

          setReportData(data);
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error loading report from backend:', error);
          message.error('Failed to load report');
          router.push('/doctors');
          return;
        }
      }

      // Fallback to sessionStorage for backward compatibility
      const storedReport = sessionStorage.getItem('generatedReport');

      if (storedReport) {
        try {
          const data = JSON.parse(storedReport);
          // Verify the chatSessionId matches
          if (data.chatSessionId === params.id) {
            setReportData(data);

            // Check if there's already a saved report for this chat session
            const existingReports = await reportManager.getReportsByChatSession(params.id as string);
            if (existingReports && existingReports.length > 0) {
              // Use the most recent report (assuming they're sorted by date)
              const latestReport = existingReports[0];
              const updatedData = {
                ...data,
                reportId: latestReport.id,
                reportContent: latestReport.content || data.reportContent,
                isSent: latestReport.isSent || false,
                sentDate: latestReport.sentDate,
              };
              
              // If report is sent, try to find patientReportId from PatientReports
              if (latestReport.isSent && latestReport.patientEmail) {
                try {
                  const patientReportsResponse = await axios.get(
                    `${Api.PatientReport.GET_PATIENT_REPORTS_BY_EMAIL}/${encodeURIComponent(latestReport.patientEmail)}`
                  );
                  if (patientReportsResponse.data?.success && patientReportsResponse.data?.dataResponse) {
                    const patientReports = patientReportsResponse.data.dataResponse as Array<{ id: string; title?: string; content?: string }>;
                    // Find matching report by title and content
                    const matchingReport = patientReports.find((pr) => 
                      pr.title === latestReport.title && 
                      pr.content === latestReport.content
                    );
                    if (matchingReport) {
                      updatedData.patientReportId = matchingReport.id;
                      updatedData.sentToEmail = latestReport.patientEmail;
                    }
                  }
                } catch (error) {
                  console.warn('Could not fetch patient reports:', error);
                }
              }
              
              setReportData(updatedData);
            }
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
    };

    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, router, searchParams]);

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

    toast.success('Report content updated locally!');
  };

  const handleSaveToBackend = async () => {
    if (!reportData) return;

    setSaving(true);
    try {
      // Patient email is optional and can be retrieved from patient profile if needed
      const patientEmail = undefined;

      if (reportData.reportId) {
        // Update existing report
        const updatedReport = await reportManager.updateReport(reportData.reportId, {
          content: reportData.reportContent,
          templateId: reportData.templateId,
          title: reportData.templateName,
          patientEmail: patientEmail,
        });

        if (updatedReport) {
          toast.success('Report saved successfully!');
          // Update local state with the saved report
          setReportData(prev => prev ? {
            ...prev,
            reportId: updatedReport.id,
          } : null);
        } else {
          toast.error(reportManager.error || 'Failed to save report');
        }
      } else {
        // Create new report
        const newReport = await reportManager.createReport({
          content: reportData.reportContent,
          templateId: reportData.templateId,
          title: reportData.templateName,
          chatSessionId: reportData.chatSessionId,
          patientEmail: patientEmail,
        });

        if (newReport) {
          toast.success('Report saved successfully!');
          // Update local state with the saved report ID
          const updatedReportData = {
            ...reportData,
            reportId: newReport.id,
          };
          setReportData(updatedReportData);
          // Update sessionStorage
          sessionStorage.setItem('generatedReport', JSON.stringify(updatedReportData));
        } else {
          toast.error(reportManager.error || 'Failed to save report');
        }
      }
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setSaving(false);
    }
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

  const handleRemoveSentReport = async () => {
    if (!reportData) {
      message.error('Report data not found');
      return;
    }

    // If we don't have patientReportId, try to find it by querying PatientReports
    let patientReportId = reportData.patientReportId;
    if (!patientReportId && reportData.sentToEmail) {
      try {
        const patientReportsResponse = await axios.get(
          `${Api.PatientReport.GET_PATIENT_REPORTS_BY_EMAIL}/${encodeURIComponent(reportData.sentToEmail)}`
        );
        if (patientReportsResponse.data?.success && patientReportsResponse.data?.dataResponse) {
          const patientReports = patientReportsResponse.data.dataResponse as Array<{ id: string; title?: string; content?: string }>;
          const matchingReport = patientReports.find((pr) => 
            pr.title === reportData.templateName && 
            pr.content === reportData.reportContent
          );
          if (matchingReport) {
            patientReportId = matchingReport.id;
          }
        }
      } catch (error) {
        console.warn('Could not fetch patient reports:', error);
      }
    }

    if (!patientReportId) {
      message.error('Patient report ID not found. Unable to remove sent report.');
      return;
    }

    setSending(true);
    try {
      const response = await axios.delete(`${Api.PatientReport.DELETE_PATIENT_REPORT}/${patientReportId}`);

      if (response.data && response.data.success) {
        // Update the DoctorService Report to mark it as not sent
        if (reportData.reportId) {
          try {
            await reportManager.updateReport(reportData.reportId, {
              patientEmail: reportData.sentToEmail,
              isSent: false,
            });
          } catch (updateError) {
            console.error('Error updating report status:', updateError);
            // Continue even if update fails - the patient report was deleted successfully
          }
        }

        // Update local state
        const updatedReportData = {
          ...reportData,
          isSent: false,
          sentDate: undefined,
          patientReportId: undefined,
          sentToEmail: undefined,
        };
        setReportData(updatedReportData);
        
        // Update sessionStorage
        sessionStorage.setItem('generatedReport', JSON.stringify(updatedReportData));

        toast.success('Sent report removed successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to remove sent report');
      }
    } catch (error) {
      console.error('Error removing sent report:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          message.error(axiosError.response.data.message);
        } else {
          message.error('Failed to remove sent report. Please try again.');
        }
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to remove sent report. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendReport = () => {
    setSendModalVisible(true);
    form.resetFields();
  };

  const handleSendModalCancel = () => {
    setSendModalVisible(false);
    form.resetFields();
  };

  const handleSendReportSubmit = async () => {
    if (!reportData) return;

    try {
      const values = await form.validateFields();
      const email = values.email.trim();

      // Validate email exists in database using auth endpoint (accessible to doctors)
      setSending(true);
      try {
        const response = await axios.post(Api.Auth.GET_USER_BY_EMAIL, { email });
        if (!response.data || !response.data.success) {
          throw new Error(response.data?.message || 'User not found');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          message.error('Email not found in the system. Please check the email address.');
          setSending(false);
          return;
        }
        // If it's a 403, it might be a different issue, but we'll still try to send
        // The backend will validate it anyway
        console.warn('Email validation warning:', errorMessage);
      }

      // Send report to patient using PatientReport API
      const patientReportData = {
        title: reportData.templateName,
        content: reportData.reportContent,
        patient_email: email,
        is_sent: true,
        sent_date: new Date().toISOString(),
        sent_by_id: user?.id || '',
        sent_by_fullname: user?.fullname || '',
      };

      const response = await axios.post(Api.PatientReport.CREATE_PATIENT_REPORT, patientReportData);

      if (response.data && response.data.success) {
        const patientReportId = response.data.dataResponse?.id;
        
        // Update the DoctorService Report to mark it as sent
        if (reportData.reportId) {
          try {
            await reportManager.updateReport(reportData.reportId, {
              content: reportData.reportContent,
              templateId: reportData.templateId,
              title: reportData.templateName,
              patientEmail: email,
              isSent: true,
              sentDate: new Date().toISOString(),
            });
          } catch (updateError) {
            console.error('Error updating report status:', updateError);
            // Continue even if update fails - the patient report was created successfully
          }
        }

        // Update local state
        const updatedReportData = {
          ...reportData,
          isSent: true,
          sentDate: new Date().toISOString(),
          patientReportId: patientReportId,
          sentToEmail: email,
        };
        setReportData(updatedReportData);
        
        // Update sessionStorage
        sessionStorage.setItem('generatedReport', JSON.stringify(updatedReportData));

        toast.success('Report sent successfully to patient!');
        setSendModalVisible(false);
        form.resetFields();
      } else {
        throw new Error(response.data?.message || 'Failed to send report');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        if (axiosError.response?.data?.message) {
          message.error(axiosError.response.data.message);
        } else {
          message.error('Failed to send report. Please try again.');
        }
      } else if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to send report. Please try again.');
      }
    } finally {
      setSending(false);
    }
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

            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveToBackend}
              loading={saving}
              disabled={saving || reportManager.isCreating || reportManager.isUpdating || reportData?.isSent}
            >
              Save Report
            </Button>
            {reportData?.isSent ? (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleRemoveSentReport}
                loading={sending}
                disabled={saving || reportManager.isCreating || reportManager.isUpdating || sending}
                danger
              >
                Remove Sent Report
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendReport}
                disabled={saving || reportManager.isCreating || reportManager.isUpdating}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                Send Report
              </Button>
            )}
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

        <p className="text-gray-500 text-sm mt-1">
          Template: {reportData.templateName} | Generated: {new Date(reportData.createdAt).toLocaleString()}
        </p>

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
              {reportData.gradcamImages.map((image) => (
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

        {/* Send Report Modal */}
        <Modal
          title="Send Report to Patient"
          open={sendModalVisible}
          onCancel={handleSendModalCancel}
          onOk={handleSendReportSubmit}
          confirmLoading={sending}
          okText="Send"
          cancelText="Cancel"
          maskClosable={false}
        >
          <Form
            form={form}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              label="Patient Email"
              name="email"
              rules={[
                { required: true, message: 'Please enter patient email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input
                placeholder="Enter patient email address"
                size="large"
              />
            </Form.Item>
            <p className="text-sm text-gray-500 mt-2">
              The email will be validated to ensure the patient exists in the system.
            </p>
          </Form>
        </Modal>

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

