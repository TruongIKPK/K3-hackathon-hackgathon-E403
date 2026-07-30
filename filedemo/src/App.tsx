import React, { useState, useEffect } from 'react';
import { MainHeader } from './components/MainHeader';
import { SidebarLeft } from './components/SidebarLeft';
import { ViewerToolbar } from './components/ViewerToolbar';
import { SlideCanvas } from './components/SlideCanvas';
import { SidebarRight } from './components/SidebarRight';
import { ByokModal } from './components/ByokModal';
import { NotesModal } from './components/NotesModal';

import { INITIAL_DAY_SECTIONS, FULL_SLIDES } from './data/mockData';
import { DaySection, DocumentItem, ViewerMode, ChatMessage, PageNote, Slide } from './types';

export default function App() {
  const [daySections, setDaySections] = useState<DaySection[]>(INITIAL_DAY_SECTIONS);
  const [activeDoc, setActiveDoc] = useState<DocumentItem>(
    INITIAL_DAY_SECTIONS[2].documents[2] // day05-slide-batch03-C401.pdf
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewerMode, setViewerMode] = useState<ViewerMode>('read');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [language, setLanguage] = useState<'VI' | 'EN'>('VI');
  const [studentName, setStudentName] = useState<string>('Sinh viên ẩn danh');

  const [selectedTextFromSlide, setSelectedTextFromSlide] = useState<string>('');
  const [isAskingAi, setIsAskingAi] = useState<boolean>(false);
  const [quotaUsed, setQuotaUsed] = useState<number>(5);
  const [quotaMax, setQuotaMax] = useState<number>(15);

  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showByokModal, setShowByokModal] = useState<boolean>(false);

  const [notes, setNotes] = useState<PageNote[]>([
    {
      id: 'n1',
      pageNumber: 1,
      content: 'Trọng tâm bài giảng Ngày 5: Nguyên tắc thiết kế AI UX cho sự không chắc chắn.',
      createdAt: '2026-07-29 10:15',
    },
    {
      id: 'n2',
      pageNumber: 3,
      content: 'Ghi nhớ khác biệt giữa Deterministic vs Probabilistic software.',
      createdAt: '2026-07-29 10:30',
    },
  ]);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);

  // Initial Chat Messages matching exact text in user screenshot
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'tutor',
      text: 'Xin chào! Mình là VLearn Tutor. Bạn có thể bôi đen một đoạn trên slide để hỏi hoặc gửi câu hỏi tự do nhé!',
      contextSlide: 1,
      timestamp: '10:00',
    },
  ]);

  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

  // Current Slide Object
  const currentSlide: Slide =
    activeDoc.slides[currentPage - 1] || {
      pageNumber: currentPage,
      title: `Trang ${currentPage}`,
      subtitle: `Nội dung slide ${currentPage}`,
      bgType: 'white',
    };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, activeDoc.pageCount]);

  // Handlers for Page Navigation
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < activeDoc.pageCount) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleJumpToPage = (page: number) => {
    if (page >= 1 && page <= activeDoc.pageCount) {
      setCurrentPage(page);
    }
  };

  // Handler for Document Selection
  const handleSelectDocument = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setCurrentPage(1);
    setSelectedTextFromSlide('');
  };

  // Handler for New Document Upload
  const handleUploadDocument = (fileName: string, pageCount: number) => {
    const newDoc: DocumentItem = {
      id: `doc-custom-${Date.now()}`,
      name: fileName,
      pageCount,
      courseCode: 'COMP2010',
      materialRef: 'Uploaded_material',
      slides: FULL_SLIDES.slice(0, pageCount),
    };

    setDaySections((prev) =>
      prev.map((day) =>
        day.id === 'day5'
          ? {
              ...day,
              documents: [newDoc, ...day.documents],
            }
          : day
      )
    );

    setActiveDoc(newDoc);
    setCurrentPage(1);
  };

  // Handler for Sending Message to VLearn Tutor
  const handleSendMessage = async (text: string, contextSelectedText?: string) => {
    const promptText = text || (contextSelectedText ? `Giải thích đoạn văn bản này giúp mình: "${contextSelectedText}"` : 'Tóm tắt trang slide này');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptText,
      selectedText: contextSelectedText,
      contextSlide: currentPage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAskingAi(true);
    setQuotaUsed((prev) => prev + 1);

    try {
      const response = await fetch('/api/tutor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          selectedText: contextSelectedText,
          pageNumber: currentPage,
          slideTitle: currentSlide.title,
          slideText: currentSlide.contentLines?.join('\n') || currentSlide.subtitle,
          docTitle: activeDoc.name,
        }),
      });

      const data = await response.json();
      const replyText = data.response || data.details || 'VLearn Tutor không thể xử lý câu trả lời lúc này.';

      const tutorMsg: ChatMessage = {
        id: `msg-tutor-${Date.now()}`,
        sender: 'tutor',
        text: replyText,
        contextSlide: currentPage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      console.error('Error contacting VLearn Tutor API:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'tutor',
        text: 'Xin lỗi, có lỗi kết nối với VLearn Tutor. Vui lòng kiểm tra lại mạng hoặc thử lại.',
        contextSlide: currentPage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAskingAi(false);
    }
  };

  const handleResetChat = () => {
    setChatMessages([
      {
        id: `m-init-${Date.now()}`,
        sender: 'tutor',
        text: 'Xin chào! Mình là VLearn Tutor. Bạn có thể bôi đen một đoạn trên slide để hỏi hoặc gửi câu hỏi tự do nhé!',
        contextSlide: currentPage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Notes Actions
  const handleAddNote = (pageNumber: number, content: string) => {
    const newNote: PageNote = {
      id: `note-${Date.now()}`,
      pageNumber,
      content,
      createdAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };
    setNotes((prev) => [...prev, newNote]);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  const pageNotesCount = notes.filter((n) => n.pageNumber === currentPage).length;

  return (
    <div className={`h-screen flex flex-col font-sans select-none overflow-hidden transition-colors ${
      isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* 1. Main Top Header */}
      <MainHeader
        currentDocName={activeDoc.name}
        courseCode={activeDoc.courseCode}
        materialRef={activeDoc.materialRef}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === 'VI' ? 'EN' : 'VI'))}
        studentName={studentName}
        onUpdateStudentName={(name) => setStudentName(name)}
      />

      {/* 2. Main Workspace Layout: Left Sidebar + Center Document + Right Tutor Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <SidebarLeft
          daySections={daySections}
          activeDocId={activeDoc.id}
          onSelectDocument={handleSelectDocument}
          onUploadDocument={handleUploadDocument}
          isDarkMode={isDarkMode}
          isCollapsed={isLeftCollapsed}
          onToggleCollapse={() => setIsLeftCollapsed((prev) => !prev)}
        />

        {/* Center Main View Container */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950 relative">
          {/* Middle Toolbar */}
          <ViewerToolbar
            mode={viewerMode}
            onSetMode={(m) => setViewerMode(m)}
            currentPage={currentPage}
            notesCount={pageNotesCount}
            onOpenNotes={() => setShowNotesModal(true)}
            zoomLevel={zoomLevel}
            onZoomIn={() => setZoomLevel((z) => Math.min(180, z + 10))}
            onZoomOut={() => setZoomLevel((z) => Math.max(60, z - 10))}
            onResetZoom={() => setZoomLevel(100)}
            onRotatePage={() => setRotation((r) => (r + 90) % 360)}
            onToggleFullscreen={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else {
                document.exitFullscreen().catch(() => {});
              }
            }}
            onClearAnnotations={() => {
              alert('Đã xóa nét vẽ ghi chú trên slide.');
            }}
            isDarkMode={isDarkMode}
          />

          {/* Slide Display Canvas */}
          <SlideCanvas
            currentSlide={currentSlide}
            totalPages={activeDoc.pageCount}
            docTitle={activeDoc.name}
            zoomLevel={zoomLevel}
            rotation={rotation}
            mode={viewerMode}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onJumpToPage={handleJumpToPage}
            onAskTutorWithText={(selectedText, regionQuestion) => {
              setIsRightCollapsed(false);
              if (regionQuestion) {
                handleSendMessage(regionQuestion, selectedText);
              } else {
                setSelectedTextFromSlide(selectedText);
              }
            }}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Right Sidebar - VLearn Tutor */}
        <SidebarRight
          currentPage={currentPage}
          selectedTextFromSlide={selectedTextFromSlide}
          onClearSelectedText={() => setSelectedTextFromSlide('')}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onResetChat={handleResetChat}
          isAskingAi={isAskingAi}
          quotaUsed={quotaUsed}
          quotaMax={quotaMax}
          onOpenByokModal={() => setShowByokModal(true)}
          isDarkMode={isDarkMode}
          isCollapsed={isRightCollapsed}
          onToggleCollapse={() => setIsRightCollapsed((prev) => !prev)}
        />
      </div>

      {/* Modals */}
      <ByokModal
        isOpen={showByokModal}
        onClose={() => setShowByokModal(false)}
        onSaveKey={(key) => {
          setCustomApiKey(key);
          setQuotaMax(999);
        }}
        currentQuotaMax={quotaMax}
        onExtendQuota={() => setQuotaMax((prev) => prev + 15)}
        isDarkMode={isDarkMode}
      />

      <NotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        currentPage={currentPage}
        notes={notes}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
