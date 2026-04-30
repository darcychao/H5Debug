import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useTestcaseStore } from '../stores/testcase.store';
import SelectorPicker from '../panels/testcase-panel/SelectorPicker';
import Recorder from '../panels/testcase-panel/Recorder';
import ReportViewer from '../panels/report-panel/ReportViewer';
import PluginList from '../panels/plugin-panel/PluginList';
import PluginConfig from '../panels/plugin-panel/PluginConfig';
import Settings from '../panels/settings-panel/Settings';
import './main-layout.css';

const MainLayout: React.FC = () => {
  const { t } = useTranslation();
  const { colorTheme, toggleColorTheme } = useTheme();
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [activeTestCaseId, setActiveTestCaseId] = useState<string | null>(null);
  const activeTestCase = useTestcaseStore((s) => s.testCases.find((tc) => tc.id === activeTestCaseId) ?? null);
  const [selectedSelector, setSelectedSelector] = useState<string>('');

  const handleSelectorSelect = (sel: string) => {
    setSelectedSelector(sel);
    console.log('[Selector] selected:', sel);
  };

  const [cdpDebug, setCdpDebug] = useState<string>('');
  const [cdpTargets, setCdpTargets] = useState<string>('');
  const devices = useDeviceStore((s) => s.devices);
  const connectedCount = devices.filter((d) => d.status === 'connected').length;

  // Debug: poll CDP pool status and targets
  useEffect(() => {
    if (!window.electronAPI) return;
    const id = setInterval(async () => {
      try {
        const status = await window.electronAPI.invoke('debug:cdpStatus') as any;
        setCdpDebug(JSON.stringify(status?.clientIds ?? []));
        // Find connected device port
        const connected = devices.find((d) => d.status === 'connected' && d.cdpPort > 0);
        if (connected) {
          const result = await window.electronAPI.invoke('debug:listTargets', connected.cdpPort) as any;
          setCdpTargets(JSON.stringify(result?.targets ?? []));
        } else if (!connected) {
          setCdpTargets(t('footer.noConnectedDevice'));
        } else if (connected.cdpPort === 0) {
          setCdpTargets(t('footer.noCdpPort'));
        }
      } catch {
        setCdpDebug('error');
      }
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const topArea = (
    <ResizableSplit direction="horizontal" initialRatio={0.65}>
      <div className="main-screencast-area">
        <ScreenView deviceId={activeDeviceId} />
      </div>
      <div className="main-console-area">
        <Tabs
          items={[
            { key: 'console', label: t('nav.console'), content: <ConsolePanel deviceId={activeDeviceId} /> },
            {
              key: 'testcase',
              label: t('nav.testcase'),
              content: (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                  <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                    <CaseDesigner testCase={activeTestCase} onCreateCase={(tc) => setActiveTestCaseId(tc.id)} deviceId={activeDeviceId} />
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <ExecutionPanel testCase={activeTestCase} />
                  </div>
                </div>
              ),
            },
            { key: 'report', label: t('nav.report'), content: <ReportViewer /> },
            { key: 'plugin', label: t('nav.plugin'), content: <PluginPanel /> },
          ]}
        />
      </div>
    </ResizableSplit>
  );

  const bottomArea = (
    <Tabs
      items={[
        { key: 'network', label: t('nav.network'), content: <NetworkPanel /> },
        { key: 'log', label: t('nav.log'), content: <LogPanel /> },
        { key: 'package', label: t('nav.package'), content: <PackagePanel deviceId={activeDeviceId} /> },
        { key: 'proxy', label: t('nav.proxy'), content: <ProxyPanel /> },
        { key: 'settings', label: t('nav.settings'), content: <Settings /> },
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
            {activeDeviceId ? `${t('footer.active')}: ${activeDeviceId}` : t('header.noDevice')}
          </span>
          <Button variant="ghost" size="sm" onClick={toggleColorTheme}>
            {colorTheme === 'dark' ? t('header.light') : t('header.dark')}
          </Button>
        </div>
      </header>

      <div className="main-body">
        <ResizableSplit direction="horizontal" initialRatio={0.2} minSize={160}>
          <div className="main-sidebar">
            <DeviceList onDeviceSelect={setActiveDeviceId} activeDeviceId={activeDeviceId} />
            <CaseList onSelect={(tc) => setActiveTestCaseId(tc.id)} activeCaseId={activeTestCaseId} />
          </div>

          <ResizableSplit direction="horizontal" initialRatio={0.75} minSize={300}>
            <ResizableSplit direction="vertical" initialRatio={0.6} minSize={200}>
              {topArea}
              {bottomArea}
            </ResizableSplit>

            <div className="main-right-panel">
              <DeviceDetail deviceId={activeDeviceId} />
              <Recorder deviceId={activeDeviceId} />
              <SelectorPicker deviceId={activeDeviceId} onSelect={handleSelectorSelect} />
            </div>
          </ResizableSplit>
        </ResizableSplit>
      </div>

      <footer className="main-footer">
        <span>{t('footer.devices')}: {connectedCount}</span>
        <span>{t('footer.cdp')}: {activeDeviceId ? t('footer.active') : '--'}</span>
        <span>{t('footer.cdpPool')}: {cdpDebug || '--'}</span>
        <span>{t('footer.targets')}: {cdpTargets || '--'}</span>
        <span>{t('footer.memory')}: --</span>
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

const PackagePanel: React.FC<{ deviceId: string | null }> = ({ deviceId }) => {
  const [deviceType, deviceRealId] = deviceId
    ? (deviceId.includes(':') ? deviceId.split(':') : [null, null]) as [string | null, string | null]
    : [null, null];
  const typedDeviceType = (deviceType === 'adb' || deviceType === 'hdc') ? deviceType : null;

  return (
    <div className="package-panel">
      <PackageActions deviceId={deviceRealId} deviceType={typedDeviceType} />
      <PackageList deviceId={deviceRealId} deviceType={typedDeviceType} />
    </div>
  );
};

const ProxyPanel: React.FC = () => <ProxyRuleList />;

const PluginPanel: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', gap: 'var(--spacing-sm)' }}>
    <PluginList />
    <PluginConfig pluginId={null} />
  </div>
);

export default MainLayout;
