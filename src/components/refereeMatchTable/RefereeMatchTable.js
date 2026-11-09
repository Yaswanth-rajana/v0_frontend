import React, { useEffect, useState } from 'react';
import { apiCall } from '@/store/utils';
import { endpoints } from '@/store/urls';
import stl from './RefereeMatchTable.module.scss';
import toast from 'react-hot-toast';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField } from '@mui/material';

const RefereeMatchTable = ({ tournamentId }) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scores, setScores] = useState({ team1Score: 0, team2Score: 0 });
  const [modalType, setModalType] = useState('start'); // 'start' or 'completed'
  const [showWalkoverModal, setShowWalkoverModal] = useState(false);
  const [walkoverMatch, setWalkoverMatch] = useState(null);
  const [selectedWalkoverTeam, setSelectedWalkoverTeam] = useState(null);
  const [confirmWalkoverStep, setConfirmWalkoverStep] = useState(false);
  const [isSubmittingWalkover, setIsSubmittingWalkover] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await apiCall(endpoints.getFixtures, {
          params: { tournament_id: tournamentId }
        });

        if (response && response.matches) {
          setMatches(response.matches);
        }
      } catch (error) {
        console.error('Failed to fetch matches:', error);
        toast.error('Failed to load matches');
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchMatches();
    }
  }, [tournamentId]);

  const handleStartMatch = async (match) => {
    try {
      await apiCall(`${endpoints.updateMatchStatus}/${match.match_id}`, {
        method: "POST",
        body: {
          tournament_id: tournamentId,
          status: "on-going"
        }
      });
      
      // Update local state
      setMatches(matches.map(m => 
        m.match_id === match.match_id 
          ? { ...m, match_status: { ...m.match_status, status: 'on-going' }} 
          : m
      ));
      
      toast.success("Match started successfully");
    } catch (error) {
      console.error("Failed to start match:", error);
      toast.error(error.message || "Failed to start match");
    }
  };

  const handleScoreUpdate = async (match, isFinal = false, override = false) => {
    try {
      const requestBody = {
        tournament_id: tournamentId,
        match_id: match.match_id,
        score: `${scores.team1Score}-${scores.team2Score}`,
        final: isFinal,
        override: override
      };

      const scorePromise = fetch(endpoints.updateMatchScore, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      const statusPromise = isFinal ? 
        apiCall(`${endpoints.updateMatchStatus}/${match.match_id}`, {
          method: "POST",
          body: {
            tournament_id: tournamentId,
            status: "completed"
          }
        }) : Promise.resolve();

      const [response] = await Promise.all([scorePromise, statusPromise]);
      const resp = await response.json();

      if (!response.ok) {
        if (response.status === 400 && resp.error?.includes("already been finalized")) {
          const shouldOverride = window.confirm("Match is already finalized. Would you like to override?");
          if (shouldOverride) {
            return handleScoreUpdate(match, isFinal, true);
          }
        }
        throw new Error(resp.error || 'Failed to update score');
      }

      // Update local state
      setMatches(matches.map(m => {
        if (m.match_id === match.match_id) {
          return {
            ...m,
            match_result: `${scores.team1Score}-${scores.team2Score}`,
            match_status: isFinal 
              ? { ...m.match_status, status: 'completed', is_final: true }
              : m.match_status
          };
        }
        return m;
      }));

      setEditingMatch(null);
      toast.success(isFinal ? 'Match finalized successfully' : 'Score updated successfully');
    } catch (error) {
      console.error('Failed to update score:', error);
      toast.error(error.message || 'Failed to update score');
    }
  };

  const handleEditClick = (match) => {
    if (match.match_status?.status === 'completed') {
      toast.error('Match is already finalized and cannot be modified');
      return;
    }

    const [team1Score, team2Score] = match.match_result.split('-').map(Number);
    setScores({ team1Score: team1Score || 0, team2Score: team2Score || 0 });
    setEditingMatch(match);
  };

  const handleStartMatchClick = (match) => {
    setSelectedMatch(match);
    setModalType('start');
    setShowStatusModal(true);
  };

  const handleWalkoverClick = (match) => {
    if (match.match_status?.status === 'completed' || match.match_status?.is_final) {
      setSelectedMatch(match);
      setModalType('completed');
      setShowStatusModal(true);
      return;
    }
    setWalkoverMatch(match);
    setSelectedWalkoverTeam(match.team1?.team_id || null);
    setConfirmWalkoverStep(false);
    setShowWalkoverModal(true);
  };

  const handleDeclareWalkover = async () => {
    if (!walkoverMatch || !selectedWalkoverTeam) {
      toast.error('Please select a winning team');
      return;
    }

    try {
      setIsSubmittingWalkover(true);
      const response = await apiCall(endpoints.declareWalkover, {
        method: 'POST',
        body: {
          tournament_id: tournamentId,
          match_id: walkoverMatch.match_id,
          winning_team_id: selectedWalkoverTeam
        }
      });

      toast.success(response.message || 'Walkover declared successfully');

      // Update local state without full reload
      setMatches(matches.map(m => {
        if (m.match_id === walkoverMatch.match_id) {
          return {
            ...m,
            match_result: 'WALKOVER',
            match_status: {
              ...m.match_status,
              status: 'completed',
              is_final: true,
              is_walkover: true,
              result_type: 'walkover',
              winner_team_id: selectedWalkoverTeam
            }
          };
        }
        return m;
      }));

      setShowWalkoverModal(false);
      setConfirmWalkoverStep(false);
      setWalkoverMatch(null);
    } catch (error) {
      console.error('Failed to declare walkover:', error);
      toast.error(error.message || 'Failed to declare walkover');
    } finally {
      setIsSubmittingWalkover(false);
    }
  };

  if (loading) {
    return <div className={stl.loading}>Loading matches...</div>;
  }

  return (
    <div className={stl.container}>
      <div className={stl.tableWrapper}>
        <table className={stl.table}>
          <thead>
            <tr>
              <th>Match ID</th>
              <th>Round</th>
              <th>Pool</th>
              <th>Team 1</th>
              <th>Team 2</th>
              <th>Result</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match.match_id}>
                <td>{match.match_id}</td>
                <td>{match.round_name || `Round ${match.round_id}`}</td>
                <td>{match.pool || '-'}</td>
                <td className={match.match_status?.winner_team_id === match.team1?.team_id ? stl.winnerHighlight : ''}>
                  {match.team1_players} {match.match_status?.winner_team_id === match.team1?.team_id ? '👑' : ''}
                </td>
                <td className={match.match_status?.winner_team_id === match.team2?.team_id ? stl.winnerHighlight : ''}>
                  {match.team2_players} {match.match_status?.winner_team_id === match.team2?.team_id ? '👑' : ''}
                </td>
                <td>
                  {editingMatch?.match_id === match.match_id ? (
                    <div className={stl.scoreInputs}>
                      <TextField
                        size="small"
                        type="number"
                        value={scores.team1Score}
                        onChange={(e) => setScores({ ...scores, team1Score: Math.max(0, parseInt(e.target.value) || 0) })}
                      />
                      <span>-</span>
                      <TextField
                        size="small"
                        type="number"
                        value={scores.team2Score}
                        onChange={(e) => setScores({ ...scores, team2Score: Math.max(0, parseInt(e.target.value) || 0) })}
                      />
                    </div>
                  ) : (
                    match.match_status?.is_walkover || match.is_walkover || match.match_result === 'WALKOVER' ? (
                      <span className={stl.walkoverTag}>WALKOVER</span>
                    ) : (
                      match.match_result
                    )
                  )}
                </td>
                <td>
                  <span className={`${stl.status} ${stl[match.match_status.status]}`}>
                    {match.match_status.status}
                  </span>
                </td>
                <td>
                  <div className={stl.actionButtons}>
                    {match.match_status.status === 'pending' && (
                      <button 
                        onClick={() => handleStartMatchClick(match)}
                        className={stl.startButton}
                      >
                        Start Match
                      </button>
                    )}
                    {match.match_status.status === 'on-going' && (
                      editingMatch?.match_id === match.match_id ? (
                        <>
                          <button 
                            onClick={() => handleScoreUpdate(match)}
                            className={stl.updateButton}
                          >
                            Update
                          </button>
                          <button 
                            onClick={() => handleScoreUpdate(match, true)}
                            className={stl.finalizeButton}
                          >
                            Finalize
                          </button>
                          <button 
                            onClick={() => setEditingMatch(null)}
                            className={stl.cancelButton}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleEditClick(match)}
                          className={stl.editButton}
                        >
                          Edit Score
                        </button>
                      )
                    )}
                    {match.match_status.status === 'completed' ? (
                      <span style={{ color: '#4CAF50', fontWeight: '600', fontSize: '0.85rem' }}>
                        Finalized
                      </span>
                    ) : (
                      <button
                        onClick={() => handleWalkoverClick(match)}
                        className={stl.walkoverButton}
                      >
                        Walkover
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog 
        open={showStatusModal} 
        onClose={() => setShowStatusModal(false)}
      >
        <DialogTitle>Start Match</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to start this match?</p>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowStatusModal(false)}
            style={{ color: '#F28C28' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              handleStartMatch(selectedMatch);
              setShowStatusModal(false);
            }}
            style={{ color: '#4CAF50' }}
          >
            Start Match
          </Button>
        </DialogActions>
      </Dialog>

      {/* Walkover Dialog */}
      <Dialog 
        open={showWalkoverModal} 
        onClose={() => setShowWalkoverModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Declare Match Walkover</DialogTitle>
        <DialogContent>
          {walkoverMatch && (
            !confirmWalkoverStep ? (
              <div>
                <p style={{ marginBottom: '1rem', color: '#555', fontSize: '0.95rem' }}>
                  Select the winning team for Match #{walkoverMatch.match_id}. A walkover immediately completes the match and advances the winner without fake scores.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  <div 
                    onClick={() => setSelectedWalkoverTeam(walkoverMatch.team1?.team_id)}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `2px solid ${selectedWalkoverTeam === walkoverMatch.team1?.team_id ? '#e65100' : '#ddd'}`,
                      backgroundColor: selectedWalkoverTeam === walkoverMatch.team1?.team_id ? '#fff3e0' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '1rem', color: '#222' }}>
                        Team {walkoverMatch.team1?.team_id}: {walkoverMatch.team1_players || walkoverMatch.team1?.name}
                      </strong>
                    </div>
                    {selectedWalkoverTeam === walkoverMatch.team1?.team_id && (
                      <span style={{ color: '#e65100', fontWeight: 'bold' }}>✓ Selected Winner</span>
                    )}
                  </div>

                  <div 
                    onClick={() => setSelectedWalkoverTeam(walkoverMatch.team2?.team_id)}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: `2px solid ${selectedWalkoverTeam === walkoverMatch.team2?.team_id ? '#e65100' : '#ddd'}`,
                      backgroundColor: selectedWalkoverTeam === walkoverMatch.team2?.team_id ? '#fff3e0' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '1rem', color: '#222' }}>
                        Team {walkoverMatch.team2?.team_id}: {walkoverMatch.team2_players || walkoverMatch.team2?.name}
                      </strong>
                    </div>
                    {selectedWalkoverTeam === walkoverMatch.team2?.team_id && (
                      <span style={{ color: '#e65100', fontWeight: 'bold' }}>✓ Selected Winner</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '0.5rem 0' }}>
                <p style={{ fontSize: '1.05rem', color: '#222' }}>
                  Are you sure you want to declare <strong>Team {selectedWalkoverTeam}</strong> as winner by <strong>Walkover</strong>?
                </p>
                <p style={{ color: '#d32f2f', fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: '1.4' }}>
                  ⚠️ This will complete Match #{walkoverMatch.match_id} and advance Team {selectedWalkoverTeam} to the next round.
                </p>
              </div>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWalkoverModal(false)} style={{ color: '#666' }}>
            Cancel
          </Button>
          {!confirmWalkoverStep ? (
            <Button 
              onClick={() => setConfirmWalkoverStep(true)} 
              disabled={!selectedWalkoverTeam}
              variant="contained"
              style={{ backgroundColor: '#e65100', color: '#fff' }}
            >
              Next
            </Button>
          ) : (
            <>
              <Button onClick={() => setConfirmWalkoverStep(false)} style={{ color: '#666' }}>
                Back
              </Button>
              <Button 
                onClick={handleDeclareWalkover} 
                disabled={isSubmittingWalkover}
                variant="contained"
                style={{ backgroundColor: '#e65100', color: '#fff' }}
              >
                {isSubmittingWalkover ? 'Submitting...' : 'Confirm Walkover'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RefereeMatchTable; 