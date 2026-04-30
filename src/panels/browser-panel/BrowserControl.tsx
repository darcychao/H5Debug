import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/pixel-ui/Card';
import Button from '../../components/pixel-ui/Button';
import { useCdpEvent } from '../../hooks/useCdpEvent';

interface BrowserControlProps {
  deviceId: string | null;
}

const BrowserControl: React.FC<BrowserControlProps> = ({ deviceId }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [displayUrl, setDisplayUrl] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [navigating, setNavigating] = useState(false);

  // Fetch current page info when device changes
  const fetchPageInfo = useCallback(async () => {
    if (!deviceId || !window.electronAPI) {
      setUrl('');
      setDisplayUrl('');
      setTitle('');
      return;
    }
    try {
      const result = await window.electronAPI.invoke('cdp:page:getInfo', deviceId) as { url: string; title: string };
      if (result?.url) {
        setUrl(result.url);
        setDisplayUrl(result.url);
      }
      if (result?.title) {
        setTitle(result.title);
      }
    } catch {
      // Device not connected or CDP unavailable
    }
  }, [deviceId]);

  useEffect(() => {
    fetchPageInfo();
  }, [fetchPageInfo]);

  // Listen for navigation events to update URL bar
  useCdpEvent('cdp:page:navigated', useCallback((data: any) => {
    if (data?.url) {
      setUrl(data.url);
      setDisplayUrl(data.url);
      setLoading(false);
    }
  }, []));

  useCdpEvent('cdp:page:loaded', useCallback(() => {
    setLoading(false);
    // Re-fetch title after load
    if (deviceId && window.electronAPI) {
      window.electronAPI.invoke('cdp:page:getInfo', deviceId).then((result: any) => {
        if (result?.title) setTitle(result.title);
        if (result?.url) {
          setUrl(result.url);
          setDisplayUrl(result.url);
        }
      }).catch(() => {});
    }
  }, [deviceId]));

  const handleNavigate = async () => {
    if (!deviceId || !displayUrl.trim() || !window.electronAPI) return;
    let navUrl = displayUrl.trim();
    // Auto-prefix with https:// if no protocol
    if (!/^https?:\/\//i.test(navUrl)) {
      navUrl = 'https://' + navUrl;
    }
    setNavigating(true);
    setLoading(true);
    try {
      await window.electronAPI.invoke('cdp:page:navigate', deviceId, navUrl);
      setUrl(navUrl);
      setDisplayUrl(navUrl);
    } catch (err) {
      console.error('Navigation failed:', err);
      setLoading(false);
    } finally {
      setNavigating(false);
    }
  };

  const handleReload = async () => {
    if (!deviceId || !window.electronAPI) return;
    setLoading(true);
    try {
      await window.electronAPI.invoke('cdp:page:reload', deviceId);
    } catch (err) {
      console.error('Reload failed:', err);
      setLoading(false);
    }
  };

  const handleGoBack = async () => {
    if (!deviceId || !window.electronAPI) return;
    setLoading(true);
    try {
      await window.electronAPI.invoke('cdp:page:goBack', deviceId);
      // Fetch updated URL after a brief delay
      setTimeout(fetchPageInfo, 500);
    } catch (err) {
      console.error('Go back failed:', err);
      setLoading(false);
    }
  };

  const handleGoForward = async () => {
    if (!deviceId || !window.electronAPI) return;
    setLoading(true);
    try {
      await window.electronAPI.invoke('cdp:page:goForward', deviceId);
      setTimeout(fetchPageInfo, 500);
    } catch (err) {
      console.error('Go forward failed:', err);
      setLoading(false);
    }
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  if (!deviceId) {
    return (
      <Card title={t('browser.title') || 'Browser'}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          {t('browser.noDevice') || 'Connect a device to control the browser'}
        </div>
      </Card>
    );
  }

  return (
    <Card title={t('browser.title') || 'Browser'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
          <Button size="sm" variant="ghost" onClick={handleGoBack} disabled={loading} style={{ padding: '2px 6px', minWidth: 28 }}>
            ◀
          </Button>
          <Button size="sm" variant="ghost" onClick={handleGoForward} disabled={loading} style={{ padding: '2px 6px', minWidth: 28 }}>
            ▶
          </Button>
          <Button size="sm" variant="ghost" onClick={handleReload} disabled={loading} style={{ padding: '2px 6px', minWidth: 28 }}>
            {loading ? '⟳' : '↻'}
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchPageInfo} style={{ padding: '2px 6px', minWidth: 28 }}>
            ⓘ
          </Button>
        </div>

        {/* URL bar */}
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'center' }}>
          <input
            className="pixel-input"
            style={{ flex: 1, fontSize: 'var(--font-size-xs)', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
            value={displayUrl}
            onChange={(e) => setDisplayUrl(e.target.value)}
            onKeyDown={handleUrlKeyDown}
            placeholder="https://example.com"
          />
          <Button size="sm" variant="primary" onClick={handleNavigate} disabled={navigating || !displayUrl.trim()}>
            {t('browser.go') || 'Go'}
          </Button>
        </div>

        {/* Page info */}
        {title && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('browser.pageTitle') || 'Title'}: {title}
          </div>
        )}
        {loading && (
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)' }}>
            {t('browser.loading') || 'Loading...'}
          </div>
        )}
      </div>
    </Card>
  );
};

export default BrowserControl;
