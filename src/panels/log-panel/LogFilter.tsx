import React from 'react';
import Select from '../../components/pixel-ui/Select';
import Input from '../../components/pixel-ui/Input';
import { useLogStore } from '../../stores/log.store';
import './LogPanel.css';

const LogFilter: React.FC = () => {
  const { filterLevel, filterSource, filterText, setFilterLevel, setFilterSource, setFilterText } = useLogStore();

  return (
    <div className="log-filter">
      <Select
        value={filterLevel}
        options={[
          { value: 'all', label: 'All Levels' },
          { value: 'ERROR', label: 'ERROR' },
          { value: 'WARNING', label: 'WARNING' },
          { value: 'INFO', label: 'INFO' },
          { value: 'DEBUG', label: 'DEBUG' },
        ]}
        onChange={setFilterLevel}
      />
      <Select
        value={filterSource}
        options={[
          { value: 'all', label: 'All Sources' },
          { value: 'device', label: 'Device' },
          { value: 'cdp', label: 'CDP' },
          { value: 'app', label: 'App' },
        ]}
        onChange={setFilterSource}
      />
      <Input
        placeholder="Filter logs..."
        value={filterText}
        onChange={(e) => setFilterText((e.target as HTMLInputElement).value)}
      />
    </div>
  );
};

export default LogFilter;
