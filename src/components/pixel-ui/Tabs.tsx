import React, { useState } from 'react';
import './Tabs.css';

interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ items, activeKey, onChange, className = '' }) => {
  const [internalKey, setInternalKey] = useState(items[0]?.key);
  const currentKey = activeKey ?? internalKey;

  const handleChange = (key: string) => {
    setInternalKey(key);
    onChange?.(key);
  };

  const activeItem = items.find((item) => item.key === currentKey);

  return (
    <div className={`pixel-tabs ${className}`}>
      <div className="pixel-tabs-bar">
        {items.map((item) => (
          <button
            key={item.key}
            className={`pixel-tabs-tab ${item.key === currentKey ? 'pixel-tabs-tab--active' : ''}`}
            onClick={() => handleChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="pixel-tabs-content">{activeItem?.content}</div>
    </div>
  );
};

export default Tabs;
