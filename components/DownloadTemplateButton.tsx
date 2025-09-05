import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface DownloadTemplateButtonProps {
    onDownload: () => void;
}

const DownloadTemplateButton: React.FC<DownloadTemplateButtonProps> = ({ onDownload }) => {
    return (
        <button
            onClick={onDownload}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-300 flex items-center"
            aria-label="Download data template"
        >
            <DownloadIcon />
            Template
        </button>
    );
};

export default DownloadTemplateButton;
