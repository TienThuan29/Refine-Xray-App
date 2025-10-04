'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  en: {
    // General
    'app.title': 'Clini AI',
    'user.name': 'User',
    'welcome.title': 'Welcome to X-ray Diagnosis',
    'welcome.description': 'Welcome to the X-ray Diagnosis application. Select a project from the sidebar to get started.',
    
    // Sidebar
    'sidebar.newChat': 'New chat',
    'sidebar.searchChats': 'Search chats',
    'sidebar.setting': 'Setting',
    'sidebar.newProject': 'New profile',
    'sidebar.seeMore': 'See more',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.language.en': 'English',
    'settings.language.vi': 'Tiếng Việt',
    'settings.theme': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.notifications': 'Notifications',
    'settings.notifications.enabled': 'Enable notifications',
    'settings.save': 'Save',
    'settings.cancel': 'Cancel',
    'settings.close': 'Close',
    'settings.saveSuccess': 'Settings saved successfully!',
    'settings.saveError': 'Error',
    'settings.saveErrorDesc': 'Failed to save settings. Please try again.',
    
    // New Chat Modal
    'newChat.title': 'Create New Profile',
    'newChat.folderTitle': 'Folder Title',
    'newChat.titlePlaceholder': 'Enter folder title...',
    'newChat.titleRequired': 'Please enter a folder title',
    'newChat.titleMinLength': 'Title must be at least 3 characters',
    'newChat.titleMaxLength': 'Title must be less than 50 characters',
    'newChat.description': 'Description',
    'newChat.descriptionPlaceholder': 'Enter description (optional)...',
    'newChat.descriptionMaxLength': 'Description must be less than 200 characters',
    'newChat.uploadFiles': 'Upload Files',
    'newChat.uploadHelp': 'Upload one X-ray image, PDF, or text file (max 10MB)',
    'newChat.dragText': 'Click or drag files to this area to upload',
    'newChat.supportedFormats': 'Supports: Images (JPG, PNG, etc.), PDF, Text files',
    'newChat.selectFiles': 'Select File',
    'newChat.selectedFile': 'Selected File',
    'newChat.create': 'Begin analyzing',
    'newChat.cancel': 'Cancel',
    'newChat.createSuccess': 'New chat created successfully!',
    'newChat.invalidFileType': 'Invalid file type. Please upload images, PDFs, or text files.',
    'newChat.fileTooLarge': 'File size too large. Maximum size is 10MB.',
    'newChat.createFolder': 'Create Folder',
    'newChat.folderCreateSuccess': 'Folder created successfully!',
    'newChat.next': 'Next',
    'newChat.back': 'Back',
    'newChat.patientInfo': 'Patient Information',
    'newChat.folderInfo': 'Folder Information',
    'newChat.chatSessionTitle': 'Chat Session Title',
    'newChat.chatSessionTitlePlaceholder': 'Enter chat session title...',
    
    // Patient Profile
    'patient.title': 'Patient Information',
    'patient.fullname': 'Full Name',
    'patient.fullnamePlaceholder': 'Enter full name',
    'patient.fullnameRequired': 'Please enter full name',
    'patient.fullnameMinLength': 'Full name must be at least 2 characters',
    'patient.fullnameMaxLength': 'Full name must be less than 100 characters',
    'patient.gender': 'Gender',
    'patient.genderPlaceholder': 'Select gender',
    'patient.genderRequired': 'Please select gender',
    'patient.genderMale': 'Male',
    'patient.genderFemale': 'Female',
    'patient.genderOther': 'Other',
    'patient.phone': 'Phone Number',
    'patient.phonePlaceholder': 'Enter phone number',
    'patient.phoneInvalid': 'Invalid phone number',
    'patient.phoneMaxLength': 'Phone number must be less than 15 characters',
    'patient.houseNumber': 'House Number',
    'patient.houseNumberPlaceholder': 'Enter house number',
    'patient.province': 'Province/City',
    'patient.provincePlaceholder': 'Select province/city',
    'patient.provinceRequired': 'Please select province/city',
    'patient.commune': 'Ward/Commune/Town',
    'patient.communePlaceholder': 'Select ward/commune/town',
    'patient.communeRequired': 'Please select ward/commune/town',
    'patient.nation': 'Nationality',
    'patient.nationPlaceholder': 'Enter nationality (default: Vietnam)',
    
    // Chat Session
    'chatSession.title': 'Chat Sessions',
    'chatSession.searchPlaceholder': 'Search chat sessions...',
    'chatSession.messages': 'messages',
    'chatSession.noMessages': 'No messages yet',
    'chatSession.loading': 'Loading...',
    
    // Login Page
    'login.title': 'Welcome to Clini AI',
    'login.subtitle': "Don't have an account?",
    'login.signUp': 'Sign Up',
    'login.googleSignIn': 'Sign in with Google',
    'login.or': 'OR',
    'login.email': 'Email',
    'login.emailPlaceholder': 'Enter your email',
    'login.emailRequired': 'Please input your email!',
    'login.emailInvalid': 'Please enter a valid email!',
    'login.password': 'Password',
    'login.passwordPlaceholder': 'Enter your password',
    'login.passwordRequired': 'Please input your password!',
    'login.rememberMe': 'Remember me',
    'login.forgotPassword': 'Forgot Password?',
    'login.loginButton': 'Login',
  },
  vi: {
    // General
    'app.title': 'Clini AI',
    'user.name': 'Người dùng',
    'welcome.title': 'Chào mừng đến với Chẩn đoán X-quang',
    'welcome.description': 'Chào mừng đến với ứng dụng Chẩn đoán X-quang. Chọn một dự án từ thanh bên để bắt đầu.',
    
    // Sidebar
    'sidebar.newChat': 'Hồ sơ mới',
    'sidebar.searchChats': 'Tìm kiếm cuộc trò chuyện',
    'sidebar.setting': 'Cài đặt',
    'sidebar.newProject': 'Dự án mới',
    'sidebar.seeMore': 'Xem thêm',
    
    // Settings
    'settings.title': 'Cài đặt',
    'settings.language': 'Ngôn ngữ',
    'settings.language.en': 'English',
    'settings.language.vi': 'Tiếng Việt',
    'settings.theme': 'Giao diện',
    'settings.theme.light': 'Sáng',
    'settings.theme.dark': 'Tối',
    'settings.notifications': 'Thông báo',
    'settings.notifications.enabled': 'Bật thông báo',
    'settings.save': 'Lưu',
    'settings.cancel': 'Hủy',
    'settings.close': 'Đóng',
    'settings.saveSuccess': 'Cài đặt đã được lưu thành công!',
    'settings.saveError': 'Lỗi',
    'settings.saveErrorDesc': 'Không thể lưu cài đặt. Vui lòng thử lại.',
    
    // New Chat Modal
    'newChat.title': 'Tạo Hồ Sơ Mới',
    'newChat.folderTitle': 'Tiêu Đề Thư Mục',
    'newChat.titlePlaceholder': 'Nhập tiêu đề thư mục...',
    'newChat.titleRequired': 'Vui lòng nhập tiêu đề thư mục',
    'newChat.titleMinLength': 'Tiêu đề phải có ít nhất 3 ký tự',
    'newChat.titleMaxLength': 'Tiêu đề phải ít hơn 50 ký tự',
    'newChat.description': 'Mô tả',
    'newChat.descriptionPlaceholder': 'Nhập mô tả (tùy chọn)...',
    'newChat.descriptionMaxLength': 'Mô tả phải ít hơn 200 ký tự',
    'newChat.uploadFiles': 'Tải Lên Tệp',
    'newChat.uploadHelp': 'Tải lên một hình ảnh X-quang, PDF hoặc tệp văn bản (tối đa 10MB)',
    'newChat.dragText': 'Nhấp hoặc kéo tệp vào khu vực này để tải lên',
    'newChat.supportedFormats': 'Hỗ trợ: Hình ảnh (JPG, PNG, v.v.), PDF, Tệp văn bản',
    'newChat.selectFiles': 'Chọn Tệp',
    'newChat.selectedFile': 'Tệp Đã Chọn',
    'newChat.create': 'Bắt đầu phân tích',
    'newChat.cancel': 'Hủy',
    'newChat.createSuccess': 'Tạo cuộc trò chuyện mới thành công!',
    'newChat.invalidFileType': 'Loại tệp không hợp lệ. Vui lòng tải lên hình ảnh, PDF hoặc tệp văn bản.',
    'newChat.fileTooLarge': 'Kích thước tệp quá lớn. Kích thước tối đa là 10MB.',
    'newChat.createFolder': 'Tạo Thư Mục',
    'newChat.folderCreateSuccess': 'Tạo thư mục thành công!',
    'newChat.next': 'Tiếp theo',
    'newChat.back': 'Quay lại',
    'newChat.patientInfo': 'Thông tin bệnh nhân',
    'newChat.folderInfo': 'Thông tin thư mục',
    'newChat.chatSessionTitle': 'Tiêu đề phiên trò chuyện',
    'newChat.chatSessionTitlePlaceholder': 'Nhập tiêu đề phiên trò chuyện...',
    
    // Patient Profile
    'patient.title': 'Thông tin bệnh nhân',
    'patient.fullname': 'Họ và tên',
    'patient.fullnamePlaceholder': 'Nhập họ và tên đầy đủ',
    'patient.fullnameRequired': 'Vui lòng nhập họ và tên',
    'patient.fullnameMinLength': 'Họ và tên phải có ít nhất 2 ký tự',
    'patient.fullnameMaxLength': 'Họ và tên không được quá 100 ký tự',
    'patient.gender': 'Giới tính',
    'patient.genderPlaceholder': 'Chọn giới tính',
    'patient.genderRequired': 'Vui lòng chọn giới tính',
    'patient.genderMale': 'Nam',
    'patient.genderFemale': 'Nữ',
    'patient.genderOther': 'Khác',
    'patient.phone': 'Số điện thoại',
    'patient.phonePlaceholder': 'Nhập số điện thoại',
    'patient.phoneInvalid': 'Số điện thoại không hợp lệ',
    'patient.phoneMaxLength': 'Số điện thoại không được quá 15 ký tự',
    'patient.houseNumber': 'Số nhà',
    'patient.houseNumberPlaceholder': 'Nhập số nhà',
    'patient.province': 'Tỉnh/Thành phố',
    'patient.provincePlaceholder': 'Chọn tỉnh/thành phố',
    'patient.provinceRequired': 'Vui lòng chọn tỉnh/thành phố',
    'patient.commune': 'Xã/Phường/Thị trấn',
    'patient.communePlaceholder': 'Chọn xã/phường/thị trấn',
    'patient.communeRequired': 'Vui lòng chọn xã/phường/thị trấn',
    'patient.nation': 'Quốc tịch',
    'patient.nationPlaceholder': 'Nhập quốc tịch (mặc định: Việt Nam)',
    
    // Chat Session
    'chatSession.title': 'Cuộc Trò Chuyện',
    'chatSession.searchPlaceholder': 'Tìm kiếm cuộc trò chuyện...',
    'chatSession.messages': 'tin nhắn',
    'chatSession.noMessages': 'Chưa có tin nhắn nào',
    'chatSession.loading': 'Đang tải...',
    
    // Login Page
    'login.title': 'Chào mừng đến với Clini AI',
    'login.subtitle': 'Chưa có tài khoản?',
    'login.signUp': 'Đăng ký',
    'login.googleSignIn': 'Đăng nhập bằng Google',
    'login.or': 'HOẶC',
    'login.email': 'Email',
    'login.emailPlaceholder': 'Nhập email của bạn',
    'login.emailRequired': 'Vui lòng nhập email!',
    'login.emailInvalid': 'Vui lòng nhập email hợp lệ!',
    'login.password': 'Mật khẩu',
    'login.passwordPlaceholder': 'Nhập mật khẩu của bạn',
    'login.passwordRequired': 'Vui lòng nhập mật khẩu!',
    'login.rememberMe': 'Ghi nhớ đăng nhập',
    'login.forgotPassword': 'Quên mật khẩu?',
    'login.loginButton': 'Đăng nhập',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'vi')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when it changes
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return (translations[language] as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
