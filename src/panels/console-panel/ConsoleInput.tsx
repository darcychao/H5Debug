import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useConsoleStore } from '../../stores/console.store';
import './ConsolePanel.css';

interface ConsoleInputProps {
  deviceId?: string | null;
}

const ConsoleInput: React.FC<ConsoleInputProps> = ({ deviceId }) => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const { executeExpression, history, historyIndex, setHistoryIndex } = useConsoleStore();

  const handleExecute = () => {
    if (!value.trim()) return;
    executeExpression(deviceId || null, value);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIdx);
        setValue(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex >= 0) {
        const newIdx = historyIndex + 1;
        if (newIdx >= history.length) {
          setHistoryIndex(-1);
          setValue('');
        } else {
          setHistoryIndex(newIdx);
          setValue(history[newIdx]);
        }
      }
    }
  };

  return (
    <div className="console-input-wrapper">
      <span className="console-prompt">&gt;</span>
      <input
        className="console-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('console.placeholder')}
        spellCheck={false}
      />
    </div>
  );
};

export default ConsoleInput;
