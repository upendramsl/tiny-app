'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Link {
  id: number;
  code: string;
  url: string;
  clicks: number;
  createdAt: string;
  lastClick: string | null;
}

export default function LinkStats() {
  const { code } = useParams() as { code: string };
  const [link, setLink] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (code) {
      fetchLink();
    }
  }, [code]);

  const fetchLink = async () => {
    try {
      const res = await fetch(`/api/links/${code}`);
      if (res.ok) {
        const data = await res.json();
        setLink(data);
      } else {
        setError('Link not found');
      }
    } catch (err) {
      setError('Failed to fetch link');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!link) return <div className="p-4">Link not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Link Statistics</h1>
        <div className="space-y-2">
          <p><strong>Code:</strong> {link.code}</p>
          <p><strong>URL:</strong> <a href={link.url} target="_blank" rel="noopener" className="text-blue-500">{link.url}</a></p>
          <p><strong>Clicks:</strong> {link.clicks}</p>
          <p><strong>Created:</strong> {new Date(link.createdAt).toLocaleString()}</p>
          <p><strong>Last Click:</strong> {link.lastClick ? new Date(link.lastClick).toLocaleString() : 'Never'}</p>
        </div>
        <div className="mt-4">
          <a href="/" className="text-blue-500">Back to Dashboard</a>
        </div>
      </div>
    </div>
  );
}