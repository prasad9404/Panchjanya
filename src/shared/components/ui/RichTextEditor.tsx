import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from "@/shared/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet'
];

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  return (
    <div className={cn("rich-text-editor bg-white rounded-xl overflow-hidden border border-slate-200", className)}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="min-h-[150px]"
      />
      <style>{`
        .rich-text-editor .ql-toolbar.ql-snow {
          border: none;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 8px;
        }
        .rich-text-editor .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 0.875rem;
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
          line-height: 1.6;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};
