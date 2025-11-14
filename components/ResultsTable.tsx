import React from 'react';
import type { AnalysisResult, Source } from '../types';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface ResultsTableProps {
  results: AnalysisResult[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  if (results.length === 0) {
    return null;
  }
  
  const allSources = results.flatMap(r => r.sources);
  const uniqueSources = Array.from(new Map(allSources.map(item => [item.uri, item])).values());


  const StatusBadge: React.FC<{ status: AnalysisResult['status'] }> = ({ status }) => {
    switch (status) {
      case 'SAME':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1.5" />
            Same Person
          </span>
        );
      case 'DIFFERENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <XCircleIcon className="w-4 h-4 mr-1.5" />
            Different
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Original
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Duplicate
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Analysis
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {results.map((result) => (
                  <tr key={result.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {result.Original}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{result.Duplicates}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <StatusBadge status={result.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {uniqueSources.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Sources</h3>
          <ul role="list" className="mt-4 space-y-2 text-sm">
            {uniqueSources.map((source, index) => {
              // FIX: Cast source to the Source type to fix type inference issue where it was treated as 'unknown'.
              const typedSource = source as Source;
              return (
                <li key={index} className="truncate">
                  <a href={typedSource.uri} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline">
                    {typedSource.title || typedSource.uri}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;