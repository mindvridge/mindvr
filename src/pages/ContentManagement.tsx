import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContentData, ContentDataFormData } from '@/types/content-data';
import { useContentData } from '@/hooks/useContentData';
import { ContentDataForm } from '@/components/content-data/ContentDataForm';
import { ContentDataTable } from '@/components/content-data/ContentDataTable';

const ContentManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    contentData,
    loading,
    addContentData,
    updateContentData,
    deleteContentData,
  } = useContentData();

  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentData | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleAddContent = async (formData: ContentDataFormData) => {
    setFormLoading(true);
    try {
      await addContentData(formData);
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditContent = async (formData: ContentDataFormData) => {
    if (!editingContent) return;
    
    setFormLoading(true);
    try {
      await updateContentData(editingContent.id, formData);
      setEditingContent(null);
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (content: ContentData) => {
    setEditingContent(content);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingContent(null);
  };

  const handleSubmit = (formData: ContentDataFormData) => {
    if (editingContent) {
      handleEditContent(formData);
    } else {
      handleAddContent(formData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드로
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">콘텐츠 관리</h1>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              새 콘텐츠 추가
            </Button>
          )}
        </div>

        {showForm && (
          <ContentDataForm
            onSubmit={handleSubmit}
            initialData={editingContent || undefined}
            onCancel={handleCancel}
            isLoading={formLoading}
          />
        )}

        <ContentDataTable
          data={contentData}
          onEdit={handleEdit}
          onDelete={deleteContentData}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ContentManagement;