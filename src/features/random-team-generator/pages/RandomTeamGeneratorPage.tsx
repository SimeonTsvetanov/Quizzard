/**
 * RandomTeamGeneratorPage Component
 * 
 * Main page component for the Random Team Generator feature.
 * Orchestrates all components and hooks to provide the complete functionality.
 * 
 * Responsibilities:
 * - Coordinate between all feature components
 * - Manage overall page layout and structure
 * - Handle integration between hooks and components
 * - Provide snackbar feedback for user actions
 */

import { useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import { useSnackbar } from '../../../shared/hooks/useSnackbar';
import { useParticipants } from '../hooks/useParticipants';
import { useTeamGeneration } from '../hooks/useTeamGeneration';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { ParticipantsList } from '../components/ParticipantsList/ParticipantsList';
import { TeamControls } from '../components/TeamControls/TeamControls';
import { TeamsModal } from '../components/TeamsModal/TeamsModal';
import { ClearConfirmDialog } from '../components/Dialogs/ClearConfirmDialog';
import { copyTeamsToClipboard } from '../utils/clipboard';

/**
 * RandomTeamGeneratorPage Component
 * 
 * The main page component that brings together all the refactored pieces.
 * Uses custom hooks for state management and coordinates between components.
 * 
 * @returns JSX element for the complete Random Team Generator page
 */
export default function RandomTeamGeneratorPage() {
  const { snackbar, showSnackbar, hideSnackbar } = useSnackbar();
  
  // Local state for dialogs
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  
  // Custom hooks for feature logic
  const {
    participants,
    nextId,
    inputRefs,
    handleInputChange,
    removeParticipant,
    getParticipantNames,
    getFilledParticipantCount,
    clearAllParticipants
  } = useParticipants();
  
  const {
    teams,
    teamCount,
    generationState,
    teamsModalOpen,
    setTeamCount,
    generateTeams,
    refreshTeams,
    clearTeams,
    openTeamsModal,
    closeTeamsModal,
    getTeamDistributionMessage,
    canGenerateTeams
  } = useTeamGeneration();
  
  // Add a simple function to add new participant for keyboard navigation
  const addNewParticipant = () => {
    // This will be handled by the existing logic in useParticipants
    // when the user types in the last input field
  };
  
  const { handleKeyDown } = useKeyboardNavigation({
    participants,
    nextId,
    inputRefs,
    onAddParticipant: addNewParticipant
  });
  
  // Derived state
  const participantNames = getParticipantNames();
  const filledCount = getFilledParticipantCount();
  const isOnlyInput = participants.length === 1;
  const distributionMessage = getTeamDistributionMessage(participantNames.length);
  const { canGenerate } = canGenerateTeams(participantNames.length);
  
  /**
   * Handle input changes with cheat code detection
   */
  const handleParticipantInputChange = (id: number, value: string) => {
    const result = handleInputChange(id, value);
    
    if (result.isCheatCode) {
      showSnackbar('🎉 The followers have joined!', 'success');
    }
  };
  
  /**
   * Handle team generation with validation and feedback
   */
  const handleGenerateTeams = async () => {
    const validation = canGenerateTeams(participantNames.length);
    
    if (!validation.canGenerate) {
      showSnackbar(validation.message || 'Cannot generate teams', 'warning');
      return;
    }
    
    try {
      const generatedTeams = generateTeams(participantNames);
      if (generatedTeams.length > 0) {
        openTeamsModal();
        showSnackbar(`Generated ${generatedTeams.length} teams successfully!`, 'success');
      }
    } catch (error) {
      showSnackbar('Error generating teams. Please try again.', 'error');
    }
  };
  
  /**
   * Handle team refresh with feedback
   */
  const handleRefreshTeams = () => {
    try {
      refreshTeams();
      showSnackbar('Teams refreshed!', 'success');
    } catch (error) {
      showSnackbar('Error refreshing teams. Please try again.', 'error');
    }
  };
  
  /**
   * Handle copy teams to clipboard
   */
  const handleCopyTeams = async () => {
    const success = await copyTeamsToClipboard(teams);
    
    if (success) {
      showSnackbar('Teams copied to clipboard! 📋', 'success');
    } else {
      showSnackbar('Failed to copy teams', 'error');
    }
  };
  
  /**
   * Handle clear all participants
   */
  const handleClearAll = () => {
    if (participantNames.length === 0) {
      showSnackbar('No participants to clear.', 'info');
      return;
    }
    setClearDialogOpen(true);
  };
  
  /**
   * Confirm clear all participants
   */
  const confirmClearAll = () => {
    clearAllParticipants();
    clearTeams();
    
    // Close dialog FIRST
    setClearDialogOpen(false);
    
    // Then show message
    setTimeout(() => {
      showSnackbar('All participants cleared.', 'success');
    }, 100);
  };
  
  /**
   * Cancel clear all action
   */
  const cancelClear = () => {
    setClearDialogOpen(false);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      {/* Main Content - Constrained width like original */}
      <Box sx={{ 
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        py: 3,
        px: { xs: 1, sm: 2 }
      }}>
        {/* Content Container with Original Width Constraints */}
        <Box sx={{ 
          width: '100%',
          maxWidth: { 
            xs: 'calc(100vw - 16px)', 
            sm: 'clamp(280px, 50vw, 600px)' // Same as original --main-content-width
          },
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}>
          {/* Participants Input Section */}
          <ParticipantsList
            participants={participants}
            filledCount={filledCount}
            isOnlyInput={isOnlyInput}
            inputRefs={inputRefs}
            onInputChange={handleParticipantInputChange}
            onKeyDown={handleKeyDown}
            onRemoveParticipant={removeParticipant}
            onClearAll={handleClearAll}
          />

          {/* Team Controls Section */}
          <TeamControls
            teamCount={teamCount}
            isGenerating={generationState.isGenerating}
            distributionMessage={distributionMessage}
            canGenerate={canGenerate}
            onTeamCountChange={setTeamCount}
            onGenerateTeams={handleGenerateTeams}
          />
        </Box>
      </Box>

      {/* Teams Modal */}
      <TeamsModal
        open={teamsModalOpen}
        teams={teams}
        isRefreshing={generationState.isRefreshing}
        isGenerating={generationState.isGenerating}
        onClose={closeTeamsModal}
        onRefresh={handleRefreshTeams}
        onCopy={handleCopyTeams}
      />

      {/* Clear Confirmation Dialog */}
      <ClearConfirmDialog
        open={clearDialogOpen}
        participantCount={participantNames.length}
        onCancel={cancelClear}
        onConfirm={confirmClearAll}
      />

      {/* Snackbar for User Feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={hideSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 