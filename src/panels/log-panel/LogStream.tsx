import React, { useRef, useEffect } from 'react';
import { useLogStore } from '../../stores/log.store';
import './LogPanel.css';

const LogStream: React.FC = () => {
  const { entries, filterLevel, filterSource, filterText, addEntry } = useLogStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  // Listen for log events from the backend
  useEffect(() => {
    if (!window.electronAPI) return;

    // Handle log:stream events from log.ipc.ts (LogService)
    const handler1 = (data: unknown) => {
      const d = data as { source?: string; level?: string; content?: string; timestamp?: number; url?: string; lineNumber?: number };
      addEntry({
        id: `cdp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        source: d.source as 'cdp' | 'device' | 'app' || 'cdp',
        level: (d.level?.toUpperCase() as 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG') || 'INFO',
        content: d.url ? `[${d.url}:${d.lineNumber ?? '?'}] ${d.content}` : (d.content || ''),
        timestamp: d.timestamp || Date.now(),
      });
    };

    // Handle cdp:log:entry events from cdp.ipc.ts (forwardCdpEvent)
    const handler2 = (data: unknown) => {
      const d = data as { deviceId?: string; params?: { entry?: { level?: string; text?: string; timestamp?: number; url?: string; lineNumber?: number } } };
      const entry = d.params?.entry;
      if (entry) {
        addEntry({
          id: `cdp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          source: 'cdp',
          level: (entry.level?.toUpperCase() as 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG') || 'INFO',
          content: entry.url ? `[${entry.url}:${entry.lineNumber ?? '?'}] ${entry.text}` : (entry.text || ''),
          timestamp: entry.timestamp || Date.now(),
        });
      }
    };

    const unsub1 = window.electronAPI.on('log:stream', handler1 as (...args: unknown[]) => void);
    const unsub2 = window.electronAPI.on('cdp:log:entry', handler2 as (...args: unknown[]) => void);
    return () => {
      unsub1();
      unsub2();
    };
  }, [addEntry]);

  const filtered = entries.filter((entry) => {
    if (filterLevel !== 'all' && entry.level !== filterLevel) return false;
    if (filterSource !== 'all' && entry.source !== filterSource) return false;
    if (filterText && !entry.content.toLowerCase().includes(filterText.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="log-stream" ref={scrollRef}>
      {filtered.map((entry) => (
        <div key={entry.id} className={`log-entry log-entry--${entry.level.toLowerCase()}`}>
          <span className="log-timestamp">{new Date(entry.timestamp).toLocaleTimeString()}</span>
          <span className="log-level">{entry.level}</span>
          <span className="log-source">{entry.source}</span>
          <span className="log-content">{entry.content}</span>
        </div>
      ))}
    </div>
  );
};

export default LogStream;