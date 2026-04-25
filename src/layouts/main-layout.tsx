import React, { useState } from 'react';
import ResizableSplit from '../components/resizable-split/ResizableSplit';
import Tabs from '../components/pixel-ui/Tabs';
import Button from '../components/pixel-ui/Button';
import { useTheme } from '../hooks/useTheme';
import { useDeviceStore } from '../stores/device.store';
import DeviceList from '../panels/device-panel/DeviceList';
import DeviceDetail from '../panels/device-panel/DeviceDetail';
import ScreenView from '../panels/screencast-panel/ScreenView';
import ConsoleInput from '../panels/console-panel/ConsoleInput';
import ConsoleOutput from '../panels/console-panel/ConsoleOutput';
import MethodOverride from '../panels/console-panel/MethodOverride';
import NetworkPanel from '../panels/network-panel/NetworkPanel';
import LogStream from '../panels/log-panel/LogStream';
import LogFilter from '../panels/log-panel/LogFilter';
import PackageList from '../panels/package-panel/PackageList';
import PackageActions from '../panels/package-panel/PackageActions';
import ProxyRuleList from '../panels/port-proxy-panel/ProxyRuleList';
import CaseList from '../panels/testcase-panel/CaseList';
import CaseDesigner from '../panels/testcase-panel/CaseDesigner';
import ExecutionPanel from '../panels/testcase-panel/ExecutionPanel';
import SelectorPicker from '../panels/testcase-panel/SelectorPicker';
import Recorder from '../panels/testcase-panel/Recorder';
import ReportViewer from '../panels/report-panel/ReportViewer';
import PluginList from '../panels/plugin-panel/PluginList';
import PluginConfig from '../panels/plugin-panel/PluginConfig';
import Settings from '../panels/settings-panel/Settings';
import './main-layout.css';

const MainLayout: React.FC = () => {
  const { theme, toggle } = useTheme();
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [activeTestCase, setActiveTestCase] = useState<any>(null);
  const devices = useDeviceStore((s) => s.devices);
  const connectedCount = devices.filter((d) => d.status === 'connected').length;

  const topArea = (
    <ResizableSplit direction="horizontal" initialRatio={0.65}>
      <div className="main-screencast-area">
        <ScreenView deviceId={activeDeviceId} />
      </div>
      <div className="main-console-area">
        <Tabs
          items={[
            { key: 'console', label: 'Console', content: <ConsolePanel deviceId={activeDeviceId} /> },
            {
              key: 'testcase',
              label: 'TestCase',
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
                  <CaseDesigner testCase={activeTestCase} />
                  <ExecutionPanel testCase={activeTestCase} />
                </div>
              ),
            },
            { key: 'report', label: 'Report', content: <ReportViewer /> },
            { key: 'plugin', label: 'Plugin', content: <PluginPanel /> },
          ]}
        />
      </div>
    </ResizableSplit>
  );

  const bottomArea = (
    <Tabs
      items={[
        { key: 'network', label: 'Network', content: <NetworkPanel /> },
        { key: 'log', label: 'Log', content: <LogPanel /> },
        { key: 'package', label: 'Package', content: <PackagePanel /> },
        { key: 'proxy', label: 'Proxy', content: <ProxyPanel /> },
        { key: 'settings', label: 'Settings', content: <Settings /> },
      ]}
    />
  );

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="main-header-left">
          <span className="main-logo">H5Debug</span>
        </div>
        <div className="main-header-right">
          <span className="header-status">
            {activeDeviceId ? `Connected: ${activeDeviceId}` : 'No device'}
          </span>
          <Button variant="ghost" size="sm" onClick={toggle}>
            {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </div>
      </header>

      <div className="main-body">
        <ResizableSplit direction="horizontal" initialRatio={0.2} minSize={160}>
          <div className="main-sidebar">
            <DeviceList onDeviceSelect={setActiveDeviceId} activeDeviceId={activeDeviceId} />
            <CaseList onSelect={setActiveTestCase} activeCaseId={activeTestCase?.id ?? null} />
          </div>

          <ResizableSplit direction="horizontal" initialRatio={0.75} minSize={300}>
            <ResizableSplit direction="vertical" initialRatio={0.6} minSize={200}>
              {topArea}
              {bottomArea}
            </ResizableSplit>

            <div className="main-right-panel">
              <DeviceDetail deviceId={activeDeviceId} />
              <Recorder deviceId={activeDeviceId} />
              <SelectorPicker deviceId={activeDeviceId} onSelect={(sel) => console.log('Selected:', sel)} />
            </div>
          </ResizableSplit>
        </ResizableSplit>
      </div>

      <footer className="main-footer">
        <span>Devices: {connectedCount}</span>
        <span>CDP: {activeDeviceId ? 'Active' : '--'}</span>
        <span>Memory: --</span>
      </footer>
    </div>
  );
};

const ConsolePanel: React.FC<{ deviceId?: string | null }> = ({ deviceId }) => (
  <div className="console-panel">
    <ConsoleOutput />
    <ConsoleInput deviceId={deviceId} />
  </div>
);

const LogPanel: React.FC = () => (
  <div className="log-panel">
    <LogFilter />
    <LogStream />
  </div>
);

const PackagePanel: React.FC = () => (
  <div className="package-panel">
    <PackageActions />
    <PackageList />
  </div>
);

const ProxyPanel: React.FC = () => <ProxyRuleList />;

const PluginPanel: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', gap: 'var(--spacing-sm)' }}>
    <PluginList />
    <PluginConfig pluginId={null} />
  </div>
);

export default MainLayout;
