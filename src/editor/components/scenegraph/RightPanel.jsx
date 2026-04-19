import { useState, useContext } from 'react';
import { Tooltip } from 'radix-ui';
import posthog from 'posthog-js';
import { faLockOpen } from '@fortawesome/free-solid-svg-icons';
import { ProfileButton } from '@shared/auth/components';
import useStore from '@/store';
import { AuthContext } from '@/editor/contexts';
import ComponentsSidebar from '../elements/Sidebar';
import { Button, Tabs } from '../elements';
import { AwesomeIcon } from '../elements/AwesomeIcon';
import styles from './RightPanel.module.scss';

const TooltipWrapper = ({ children, content, side = 'bottom' }) => (
  <Tooltip.Root delayDuration={0}>
    <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
    <Tooltip.Portal>
      <Tooltip.Content
        side={side}
        sideOffset={5}
        style={{
          backgroundColor: '#2d2d2d',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          border: '1px solid #4b4b4b',
          zIndex: 1000
        }}
      >
        {content}
        <Tooltip.Arrow style={{ fill: '#2d2d2d' }} />
      </Tooltip.Content>
    </Tooltip.Portal>
  </Tooltip.Root>
);

export default function RightPanel({ entity, visible }) {
  const { currentUser: authUser, isLoading } = useContext(AuthContext) || {};
  const setModal = useStore((s) => s.setModal);
  const [activeTab, setActiveTab] = useState('properties');

  const planLabel = authUser?.isPro
    ? authUser?.isProTeam
      ? 'TEAM'
      : 'PRO'
    : 'FREE';
  const planTooltip = authUser?.isPro
    ? authUser?.isProTeam
      ? `3DStreet Team Plan (${authUser?.teamDomain})`
      : '3DStreet Pro Plan'
    : '3DStreet Free Community Edition';

  const handleShare = () => {
    const currentUser = useStore.getState().currentUser || authUser;
    if (
      currentUser &&
      window.STREET?.utils?.getAuthorId?.() === currentUser.uid
    ) {
      useStore.getState().saveScene(false);
    }
    useStore.getState().setModal('share');
  };

  const handleOpenConsole = () => {
    if (window.aiChatPanelRef?.openPanel) {
      window.aiChatPanelRef.openPanel();
    }
  };

  const openPropertiesTab = () => setActiveTab('properties');
  const openConsoleTab = () => {
    setActiveTab('console');
    handleOpenConsole();
  };

  return (
    <Tooltip.Provider>
      <div id="rightPanel" className={styles.rightPanel}>
        <div className={styles.header}>
          <div className={styles.headerRow}>
            <TooltipWrapper content="Share scene">
              <Button
                leadingIcon={<AwesomeIcon icon={faLockOpen} size={18} />}
                onClick={handleShare}
                variant="toolbtn"
              >
                <div>Share</div>
              </Button>
            </TooltipWrapper>
            <div className={styles.headerSpacer} />
            <TooltipWrapper content={planTooltip}>
              <div
                className={styles.planBadge}
                onClick={() => setModal(authUser ? 'profile' : 'signin')}
              >
                {planLabel}
              </div>
            </TooltipWrapper>
            <ProfileButton
              currentUser={authUser}
              isLoading={isLoading}
              onClick={() => {
                if (isLoading) return;
                posthog.capture('profile_button_clicked', {
                  is_logged_in: !!authUser
                });
                setModal(authUser ? 'profile' : 'signin');
              }}
              tooltipSide="bottom"
            />
          </div>
        </div>
        <div className={styles.tabsRow}>
          <Tabs
            tabs={[
              {
                label: 'Properties',
                value: 'properties',
                isSelected: activeTab === 'properties',
                onClick: openPropertiesTab
              },
              {
                label: 'Console',
                value: 'console',
                isSelected: activeTab === 'console',
                onClick: openConsoleTab
              }
            ]}
          />
        </div>
        <div className={styles.content}>
          {activeTab === 'properties' ? (
            <ComponentsSidebar entity={entity} visible={visible} />
          ) : (
            <div className={styles.consolePlaceholder}>
              <p>
                The AI assistant is available as a floating panel. Click the
                button below to open it.
              </p>
              <button
                type="button"
                className={styles.consoleOpenButton}
                onClick={handleOpenConsole}
              >
                Open AI Assistant
              </button>
            </div>
          )}
        </div>
      </div>
    </Tooltip.Provider>
  );
}
