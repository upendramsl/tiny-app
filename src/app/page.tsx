'use client';

import { useState, useEffect } from 'react';

interface Link {
  id: number;
  code: string;
  url: string;
  clicks: number;
  createdAt: string;
  lastClick: string | null;
}

export default function Home() {
  const [links, setLinks] = useState<Link[]>([]);
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const res = await fetch('/api/links');
      if (res.ok) {
        const data = await res.json();
        setLinks(data);
      } else {
        setError('Failed to fetch links');
      }
    } catch (err) {
      setError('Failed to fetch links');
    } finally {
      setLoading(false);
    }
  };

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, code: code || undefined }),
      });
      if (res.ok) {
        const newLink = await res.json();
        setLinks([newLink, ...links]);
        setUrl('');
        setCode('');
      } else {
        const err = await res.json();
        setError(err.error);
      }
    } catch (err) {
      setError('Failed to create link');
    }
  };

  const deleteLink = async (code: string) => {
    try {
      const res = await fetch(`/api/links/${code}`, { method: 'DELETE' });
      if (res.ok) {
        setLinks(links.filter(l => l.code !== code));
      } else {
        setError('Failed to delete link');
      }
    } catch (err) {
      setError('Failed to delete link');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredLinks = links.filter(l =>
    l.url.toLowerCase().includes(search.toLowerCase()) ||
    l.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">TinyLink Dashboard</h1>

        <form onSubmit={createLink} className="mb-6 p-4 bg-white rounded shadow">
          <h2 className="text-xl mb-4">Create Short Link</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Custom Code (optional)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2 border rounded"
              pattern="[A-Za-z0-9]{6,8}"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Create
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </form>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">URL</th>
              <th className="p-2 text-left">Clicks</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLinks.map((link) => (
              <tr key={link.id} className="border-b">
                <td className="p-2">
                  <a href={`/code/${link.code}`} className="font-mono text-blue-500">{link.code}</a>
                  <button
                    onClick={() => copyToClipboard(`${window.location.origin}/${link.code}`)}
                    className="ml-2 text-gray-500"
                  >
                    Copy
                  </button>
                </td>
                <td className="p-2 truncate max-w-xs" title={link.url}>
                  {link.url}
                </td>
                <td className="p-2">{link.clicks}</td>
                <td className="p-2">{new Date(link.createdAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <button
                    onClick={() => deleteLink(link.code)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
