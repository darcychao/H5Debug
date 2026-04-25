import React, { useRef, useEffect } from 'react';
import { useConsoleStore } from '../../stores/console.store';
import './ConsolePanel.css';

const ConsoleOutput: React.FC = () => {
  const entries = useConsoleStore((s) => s.entries);
  const clearEntries = useConsoleStore((s) => s.clearEntries);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="console-output" ref={scrollRef}>
      {entries.map((entry) => (
        <div key={entry.id} className={`console-line console-line--${entry.type}`}>
          <span className="console-line-prefix">[{entry.type}]</span>
          <span className="console-line-content">{entry.content}</span>
        </div>
      ))}
    </div>
  );
};

export default ConsoleOutput;
