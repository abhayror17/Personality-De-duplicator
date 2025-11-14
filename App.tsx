import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import ResultsTable from './components/ResultsTable';
import Spinner from './components/Spinner';
import { GoogleIcon, SparklesIcon, DownloadIcon } from './components/Icons';
import { parseExcelFile } from './utils/excelParser';
import { analyzeRow } from './services/geminiService';
import type { ExcelRow, AnalysisResult } from './types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const handleFileUpload = useCallback((uploadedFile: File) => {
    setFile(uploadedFile);
    setResults([]);
    setError(null);
  }, []);

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress(0);
    setTotal(0);

    try {
      const data = await parseExcelFile(file);
      if (data.length === 0) {
        setError("The Excel file is empty or could not be parsed.");
        setIsLoading(false);
        return;
      }
      setTotal(data.length);
      
      const RETRY_DELAY = 1000;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        let attempt = 0;
        
        // Loop indefinitely for the current row until a valid result is obtained
        while (true) {
          try {
            attempt++;
            if (attempt > 1) {
              console.log(`Retrying row ${i + 1}, attempt ${attempt}...`);
              await sleep(RETRY_DELAY * (attempt > 3 ? 3 : attempt)); // Cap delay
            }
            
            const analysis = await analyzeRow(row);
            
            // Only proceed if we get a definitive answer
            if (analysis.status === 'SAME' || analysis.status === 'DIFFERENT') {
              const finalResult: AnalysisResult = { ...row, id: i, ...analysis };
              setResults(prev => [...prev, finalResult].sort((a, b) => a.id - b.id));
              setProgress(p => p + 1);
              break; // Exit while loop and move to the next row
            }
            
            // If status is 'ERROR', log it and the while loop will continue, retrying
            console.warn(`Analysis for row ${i + 1} returned status '${analysis.status}'. Retrying...`);

          } catch (e) {
             console.error(`An exception occurred while analyzing row ${i + 1}, attempt ${attempt}:`, e);
          }
        }
        
        // Add a small delay between successful row analyses to avoid rate limiting
        await sleep(250);
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred during parsing.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = useCallback(() => {
    if (results.length === 0) return;

    const headers = ['Original', 'Duplicates', 'Analysis'];
    const rows = results.map(res => [
        `"${res.Original.replace(/"/g, '""')}"`, // Handle quotes
        `"${res.Duplicates.replace(/"/g, '""')}"`,
        res.status
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'analysis_results.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [results]);
  
  const WelcomeState = () => (
      <div className="text-center py-8">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-2 text-lg font-medium text-gray-900">Welcome to the Personality De-duplicator</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload an Excel file with 'Original' and 'Duplicates' columns to get started.
          </p>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4">
            <SparklesIcon className="h-10 w-10 text-indigo-600" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
              Personality De-duplicator
            </h1>
          </div>
          <p className="mt-3 max-w-2xl mx-auto text-md text-gray-600">
            Leveraging <span className="font-semibold text-gray-900">Gemini</span> and{' '}
            <span className="inline-flex items-center font-semibold text-gray-900">
              <GoogleIcon className="h-4 w-4 mr-1"/> Google Search
            </span>{' '}
            to intelligently determine if two names refer to the same person.
          </p>
        </header>

        <main className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">1. Upload your file</h2>
              <p className="text-sm text-gray-500 mb-4">
                The file must contain two columns: "Original" and "Duplicates".
              </p>
              <FileUpload onFileUpload={handleFileUpload} disabled={isLoading} />
              {file && !isLoading && (
                <div className="mt-3 text-sm text-gray-700">
                  Selected file: <span className="font-medium">{file.name}</span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">2. Analyze Data</h2>
              <p className="text-sm text-gray-500 mb-4">
                Click the button below to start the analysis for each row.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={!file || isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <SparklesIcon className="-ml-1 mr-3 h-5 w-5" />
                {isLoading ? `Analyzing... (${progress}/${total})` : 'Analyze File'}
              </button>
            </div>
            
            {error && <div className="text-red-600 bg-red-50 p-3 rounded-md text-sm">{error}</div>}

            {isLoading && (
                <div className="space-y-4 pt-4">
                    <Spinner />
                    <p className="text-center text-gray-600">
                        Analyzing {progress} of {total} rows... This may take a moment.
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}>
                      </div>
                    </div>
                </div>
            )}
            
            {results.length > 0 && !isLoading && (
              <div className="mt-8">
                <div className="text-right mb-4">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <DownloadIcon className="-ml-1 mr-2 h-5 w-5" />
                        Export as CSV
                    </button>
                </div>
                <ResultsTable results={results} />
              </div>
            )}
            {!isLoading && results.length === 0 && file === null && <WelcomeState />}
          </div>
        </main>

        <footer className="text-center mt-12 text-sm text-gray-500">
          <p>Built with React, Tailwind CSS, and the Google Gemini API.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;