import React from 'react';
import FileUploadButton from './FileUploadButton';
import DownloadTemplateButton from './DownloadTemplateButton';

interface HeaderProps {
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onDownloadTemplate: () => void;
    isLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({ onFileUpload, onDownloadTemplate, isLoading }) => {
    return (
        <header className="bg-gray-800 p-4 flex justify-between items-center shadow-md z-10 flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-teal-400 whitespace-nowrap">
                <span className="text-white">AI</span> Fuel Consumption POS
            </h1>
            <div className="flex items-center gap-4">
                <DownloadTemplateButton onDownload={onDownloadTemplate} />
                <FileUploadButton onFileUpload={onFileUpload} isLoading={isLoading} />
            </div>
        </header>
    );
};

export default Header;