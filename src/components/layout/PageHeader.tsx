import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  back?: boolean;
  right?: ReactNode;
}

export default function PageHeader({ title, back, right }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="page-header">
      {back && (
        <button
          className="btn-icon"
          onClick={() => navigate(-1)}
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className="page-title">{title}</h1>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </div>
  );
}
