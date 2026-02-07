import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProgramPickerModal } from '../ProgramPickerModal';

const mockPrograms = [
  {
    id: 1,
    programId: 100,
    program: { id: 100, title: 'Sprint Training', category: 'sprint', duration: '4 weeks' },
    assignerName: 'Coach Bob',
  },
  {
    id: 2,
    programId: 200,
    program: { id: 200, title: 'Distance Plan', category: 'distance' },
  },
];

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  programs: mockPrograms,
  selectedProgramId: 1,
  onSelect: jest.fn(),
  isLoading: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProgramPickerModal', () => {
  it('renders nothing visible when visible=false', () => {
    const { toJSON } = render(
      <ProgramPickerModal {...defaultProps} visible={false} />,
    );
    // Modal with visible=false renders null in the test environment
    expect(toJSON()).toBeNull();
  });

  it('renders modal content when visible=true', () => {
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} />,
    );
    expect(getByText('Your Programs')).toBeTruthy();
  });

  it('shows loading state when isLoading is true', () => {
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} isLoading={true} />,
    );
    expect(getByText('Loading programs...')).toBeTruthy();
  });

  it('shows empty state when no programs', () => {
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} programs={[]} />,
    );
    expect(getByText('No programs assigned yet')).toBeTruthy();
  });

  it('shows list of programs with title and category', () => {
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} />,
    );
    expect(getByText('Sprint Training')).toBeTruthy();
    expect(getByText('Distance Plan')).toBeTruthy();
    expect(getByText(/sprint/)).toBeTruthy();
    expect(getByText(/distance/)).toBeTruthy();
  });

  it('shows program duration when available', () => {
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} />,
    );
    expect(getByText(/4 weeks/)).toBeTruthy();
  });

  it('shows "Unnamed Program" for programs without title', () => {
    const programs = [
      {
        id: 3,
        programId: 300,
        program: { id: 300, title: '', category: '' },
      },
    ];
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} programs={programs} selectedProgramId={null} />,
    );
    expect(getByText('Unnamed Program')).toBeTruthy();
  });

  it('calls onSelect when program is pressed', () => {
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} />,
    );

    fireEvent.press(getByText('Distance Plan'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(mockPrograms[1]);
  });

  it('calls onClose when close button pressed', () => {
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} />,
    );

    fireEvent.press(getByText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows subtitle text', () => {
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} />,
    );
    expect(
      getByText('Select a training program to view or switch between your assigned programs.'),
    ).toBeTruthy();
  });

  it('shows "Training Program" as default category when missing', () => {
    const programs = [
      {
        id: 5,
        programId: 500,
        program: { id: 500, title: 'No Category', category: undefined },
      },
    ];
    const { getByText } = render(
      <ProgramPickerModal {...defaultProps} programs={programs} selectedProgramId={null} />,
    );
    expect(getByText('Training Program')).toBeTruthy();
  });
});
