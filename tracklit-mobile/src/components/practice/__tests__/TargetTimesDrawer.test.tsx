import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TargetTimesDrawer } from '../TargetTimesDrawer';

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).__mockAsyncStorage._resetStore();
});

describe('TargetTimesDrawer', () => {
  it('returns null when visible=false', () => {
    const { toJSON } = render(
      <TargetTimesDrawer visible={false} onClose={jest.fn()} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('renders drawer content when visible=true', () => {
    const { getByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    expect(getByText('Track Type')).toBeTruthy();
    expect(getByText('Timing Method')).toBeTruthy();
    expect(getByText('Goal Times')).toBeTruthy();
    expect(getByText('Target Times')).toBeTruthy();
  });

  it('shows track type toggles (Indoor/Outdoor)', () => {
    const { getByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    expect(getByText('Outdoor')).toBeTruthy();
    expect(getByText('Indoor')).toBeTruthy();
  });

  it('shows timing method buttons', () => {
    const { getByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    expect(getByText('Reaction')).toBeTruthy();
    expect(getByText('First Foot')).toBeTruthy();
    expect(getByText('On Movement')).toBeTruthy();
  });

  it('shows goal time inputs for 100m, 200m, 400m, Hurdles, 400H', () => {
    const { getAllByText, getByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    expect(getAllByText('100m').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('200m').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('400m').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Hurdles')).toBeTruthy();
    expect(getByText('400H')).toBeTruthy();
  });

  it('shows "Adjust for Track Type" toggle', () => {
    const { getByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    expect(getByText('Adjust for Track Type')).toBeTruthy();
    expect(getByText('Apply track-specific timing adjustments')).toBeTruthy();
  });

  it('shows distance labels in target times table', () => {
    const { getByText, getAllByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    // Default goal100m = 11.0 should generate distances
    expect(getByText('Dist')).toBeTruthy();
    expect(getByText('50m')).toBeTruthy();
    expect(getByText('60m')).toBeTruthy();
    expect(getAllByText('100m').length).toBeGreaterThanOrEqual(1);
  });

  it('shows percentage columns', () => {
    const { getByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    expect(getByText('100%')).toBeTruthy();
    expect(getByText('95%')).toBeTruthy();
    expect(getByText('60%')).toBeTruthy();
  });

  it('calculates target times based on inputs', () => {
    const { getAllByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    // With default goal100m = 11.0 and firstFoot timing method:
    // adjusted100m = 11.0 - 0.55 = 10.45
    // 100m time at 100% = 10.45 -> "10.45"
    expect(getAllByText('10.45').length).toBeGreaterThanOrEqual(1);
  });

  it('saves values to AsyncStorage when track type changed', async () => {
    const { getByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );

    fireEvent.press(getByText('Indoor'));

    await waitFor(() => {
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'tracklit_currentTrackType',
        'indoor',
      );
    });
  });

  it('saves values to AsyncStorage when timing method changed', async () => {
    const { getByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );

    fireEvent.press(getByText('Reaction'));

    await waitFor(() => {
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'tracklit_timingMethod',
        'reaction',
      );
    });
  });

  it('saves goal time to AsyncStorage when changed', async () => {
    const { getByDisplayValue } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );

    // Default 100m goal is "11.0"
    const input = getByDisplayValue('11.0');
    fireEvent.changeText(input, '10.5');

    await waitFor(() => {
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'tracklit_goal100m',
        '10.5',
      );
    });
  });

  it('normalizes comma to period in goal time input', async () => {
    const { getByDisplayValue } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );

    const input = getByDisplayValue('11.0');
    fireEvent.changeText(input, '10,8');

    await waitFor(() => {
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'tracklit_goal100m',
        '10.8',
      );
    });
  });

  it('calls onClose when close button pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <TargetTimesDrawer visible={true} onClose={onClose} />,
    );

    // The close button renders FontAwesome5 "times" which renders as text
    fireEvent.press(getByText('times'));
    expect(onClose).toHaveBeenCalled();
  });

  it('loads saved values from AsyncStorage on mount', async () => {
    mockedAsyncStorage.getItem.mockImplementation(async (key: string) => {
      if (key === 'tracklit_currentTrackType') return 'indoor';
      if (key === 'tracklit_timingMethod') return 'reaction';
      if (key === 'tracklit_goal100m') return '10.2';
      return null;
    });

    const { findByDisplayValue } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );

    expect(await findByDisplayValue('10.2')).toBeTruthy();
  });

  it('shows estimates note at bottom', () => {
    const { getByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    expect(
      getByText('Times are estimates based on selected track type and timing method.'),
    ).toBeTruthy();
  });

  it('shows "sec" unit label for each input', () => {
    const { getAllByText } = render(
      <TargetTimesDrawer visible={true} onClose={jest.fn()} />,
    );
    const secLabels = getAllByText('sec');
    expect(secLabels.length).toBe(5); // 100m, 200m, 400m, Hurdles, 400H
  });
});
