/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import axios from 'axios';
import React from 'react';

import { EuiLoadingSpinner, EuiSwitch } from '@elastic/eui';
import { injectI18n } from '@kbn/i18n/react';

import chrome from 'ui/chrome';
import { LoadingState } from '../../types';

interface DeprecationLoggingTabState {
  loadingState: LoadingState;
  loggingEnabled?: boolean;
}

export class DeprecationLoggingToggleUI extends React.Component<
  ReactIntl.InjectedIntlProps,
  DeprecationLoggingTabState
> {
  constructor(props: ReactIntl.InjectedIntlProps) {
    super(props);

    this.state = {
      loadingState: LoadingState.Loading,
    };
  }

  public componentWillMount() {
    this.loadData();
  }

  public render() {
    const { loggingEnabled, loadingState } = this.state;

    // Show a spinner until we've done the initial load.
    if (loadingState === LoadingState.Loading && loggingEnabled === undefined) {
      return <EuiLoadingSpinner size="l" />;
    }

    return (
      <EuiSwitch
        id="xpack.upgradeAssistant.overviewTab.steps.deprecationLogsStep.enableDeprecationLoggingToggleSwitch"
        data-test-subj="upgradeAssistantDeprecationToggle"
        label={this.renderLoggingState()}
        checked={loggingEnabled}
        onChange={this.toggleLogging}
        disabled={loadingState === LoadingState.Loading || loadingState === LoadingState.Error}
      />
    );
  }

  private renderLoggingState() {
    const { intl } = this.props;
    const { loggingEnabled, loadingState } = this.state;

    if (loadingState === LoadingState.Error) {
      return intl.formatMessage({
        id:
          'xpack.upgradeAssistant.overviewTab.steps.deprecationLogsStep.enableDeprecationLoggingToggleSwitch.errorLabel',
        defaultMessage: 'Could not load logging state',
      });
    } else if (loggingEnabled) {
      return intl.formatMessage({
        id:
          'xpack.upgradeAssistant.overviewTab.steps.deprecationLogsStep.enableDeprecationLoggingToggleSwitch.enabledLabel',
        defaultMessage: 'On',
      });
    } else {
      return intl.formatMessage({
        id:
          'xpack.upgradeAssistant.overviewTab.steps.deprecationLogsStep.enableDeprecationLoggingToggleSwitch.disabledLabel',
        defaultMessage: 'Off',
      });
    }
  }

  private loadData = async () => {
    try {
      this.setState({ loadingState: LoadingState.Loading });
      const resp = await axios.get(
        chrome.addBasePath('/api/upgrade_assistant/deprecation_logging')
      );
      this.setState({
        loadingState: LoadingState.Success,
        loggingEnabled: resp.data.isEnabled,
      });
    } catch (e) {
      this.setState({ loadingState: LoadingState.Error });
    }
  };

  private toggleLogging = async () => {
    try {
      // Optimistically toggle the UI
      const newEnabled = !this.state.loggingEnabled;
      this.setState({ loadingState: LoadingState.Loading, loggingEnabled: newEnabled });

      const resp = await axios.put(
        chrome.addBasePath('/api/upgrade_assistant/deprecation_logging'),
        {
          isEnabled: newEnabled,
        },
        {
          headers: {
            'kbn-xsrf': chrome.getXsrfToken(),
          },
        }
      );

      this.setState({
        loadingState: LoadingState.Success,
        loggingEnabled: resp.data.isEnabled,
      });
    } catch (e) {
      this.setState({ loadingState: LoadingState.Error });
    }
  };
}

export const DeprecationLoggingToggle = injectI18n(DeprecationLoggingToggleUI);
