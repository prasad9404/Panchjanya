import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
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
    ['link'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'link'
];

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  return (
    <div className={cn("rich-text-editor bg-white rounded-xl border border-slate-200 relative", className)}>
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
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
        }
        .rich-text-editor .ql-container.ql-snow {
          border: none;
          font-family: inherit;
          font-size: 0.875rem;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
          line-height: 1.6;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        /* Ensure tooltip is visible and positioned correctly */
        .rich-text-editor .ql-tooltip {
          z-index: 100 !important;
          background-color: white !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
        }
        .rich-text-editor .ql-tooltip input[type=text] {
          border-radius: 6px !important;
          border: 1px solid #e2e8f0 !important;
          padding: 4px 8px !important;
        }
      `}</style>
    </div>
  );
};
