import React from 'react';

interface FileUploadButtonProps {
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading: boolean;
}

const FileUploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


const FileUploadButton: React.FC<FileUploadButtonProps> = ({ onFileUpload, isLoading }) => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileUpload}
                className="hidden"
                accept=".xlsx, .xls"
                disabled={isLoading}
            />
            <button
                onClick={handleClick}
                className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 flex items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                disabled={isLoading}
            >
                <FileUploadIcon />
                Import XLSX
            </button>
        </div>
    );
};

export default FileUploadButton;