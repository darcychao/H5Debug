import React, { useRef, useEffect } from 'react';
import { useLogStore } from '../../stores/log.store';
import './LogPanel.css';

const LogStream: React.FC = () => {
  const { entries, filterLevel, filterSource, filterText } = useLogStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

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
