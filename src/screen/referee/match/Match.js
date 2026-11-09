'use client'

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useRouter } from "next/navigation";
import { endpoints } from "@/store/urls";
import { apiCall } from "@/store/utils";
import stl from "./Match.module.scss";
import toast from "react-hot-toast";
import { TextField } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";

const MatchScreen = ({ tournamentId, matchId }) => {
    const [scoreData, setScoreData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [showStartModal, setShowStartModal] = useState(false);
    const [matchStatus, setMatchStatus] = useState(null);
    const [isWalkoverModalOpen, setWalkoverModalOpen] = useState(false);
    const [selectedWalkoverTeam, setSelectedWalkoverTeam] = useState(null);
    const [confirmWalkoverStep, setConfirmWalkoverStep] = useState(false);
    const [isSubmittingWalkover, setIsSubmittingWalkover] = useState(false);
    const router = useRouter();

    const getScores = async () => {
        setLoading(true);
        try {
            if (!tournamentId) {
                throw new Error("Tournament ID is missing");
            }

            const response = await apiCall(endpoints.getMatchScore, {
                method: "GET",
                params: {
                    match_id: matchId,
                    tournament_id: tournamentId,
                },
            });
            
            if (!response) {
                throw new Error("Failed to fetch match details");
            }

            setMatchStatus(response.status || 'pending');
            
            // Only prompt to start if the match has not started yet
            if (response.status === 'pending') {
                setShowStartModal(true);
            }

            setScoreData(response);
            if (response.team1?.score !== undefined) {
                formik.setFieldValue("team1Score", response.team1.score);
            }
            if (response.team2?.score !== undefined) {
                formik.setFieldValue("team2Score", response.team2.score);
            }
        } catch (error) {
            console.error("Failed to fetch Score:", error.message);
            toast.error(error.message || "Failed to fetch match details");
            setScoreData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tournamentId && matchId) {
            getScores();
        }
    }, [tournamentId, matchId]);

    const formik = useFormik({
        initialValues: {
            team1Score: 0,
            team2Score: 0,
        },
        validationSchema: Yup.object({
            team1Score: Yup.number().min(0, "Score cannot be negative").required("Required"),
            team2Score: Yup.number().min(0, "Score cannot be negative").required("Required"),
        }),
        onSubmit: (values) => updateScore(),
    });

    const handleScoreChange = (team, scoreChange) => {
        formik.setFieldValue(
            team === "team1" ? "team1Score" : "team2Score",
            Math.max(formik.values[team === "team1" ? "team1Score" : "team2Score"] + scoreChange, 0)
        );
    };

    const resetScore = (team) => {
        formik.setFieldValue(team === "team1" ? "team1Score" : "team2Score", 0);
    };

    const updateScore = async (isFinal = false) => {
        try {
            const requestBody = {
                tournament_id: tournamentId,
                match_id: matchId,
                score: `${formik.values.team1Score}-${formik.values.team2Score}`,
                final: isFinal
            };

            const scorePromise = fetch(endpoints.updateMatchScore, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody),
            });

            const statusPromise = isFinal ? 
                apiCall(`${endpoints.updateMatchStatus}/${matchId}`, {
                    method: "POST",
                    body: {
                        tournament_id: tournamentId,
                        status: "completed"
                    }
                }) : Promise.resolve();

            const [response, statusResponse] = await Promise.all([
                scorePromise,
                statusPromise
            ]);

            const resp = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    toast.error("Tournament or match not found");
                } else if (response.status === 400) {
                    if (resp.error && resp.error.includes("already been finalized")) {
                        toast.error("Match is already finalized and cannot be modified.");
                        return;
                    }
                    toast.error(resp.error || "Bad request");
                } else {
                    toast.error("An error occurred while updating the score");
                }
                throw new Error(`Error ${response.status}: ${resp.error}`);
            }

            if (resp) {
                toast.success(resp.message);
                formik.setFieldValue("team1Score", resp.team1_score);
                formik.setFieldValue("team2Score", resp.team2_score);
                
                if (isFinal && resp.winner_team_id) {
                    setScoreData(prev => ({
                        ...prev,
                        winner_team_id: resp.winner_team_id
                    }));
                    setMatchStatus('completed');
                }
                
                if (isFinal) {
                    router.push(`/referee/${tournamentId}/matches`);
                }
            }
        } catch (error) {
            console.error("Failed to update score:", error);
            toast.error("Failed to update score. Please try again.");
        }
    };

    const finalizeScore = () => {
        setModalOpen(true);
    };

    const confirmFinalize = () => {
        setModalOpen(false);
        updateScore(true);
    };

    const handleOpenWalkoverModal = () => {
        if (matchStatus === 'completed' || scoreData?.is_final) {
            toast.error("Match is already finalized and cannot be modified.");
            return;
        }
        setSelectedWalkoverTeam(scoreData?.team1?.team_id || null);
        setConfirmWalkoverStep(false);
        setWalkoverModalOpen(true);
    };

    const submitWalkover = async () => {
        if (!selectedWalkoverTeam) {
            toast.error("Please select a winning team");
            return;
        }

        try {
            setIsSubmittingWalkover(true);
            const response = await apiCall(endpoints.declareWalkover, {
                method: "POST",
                body: {
                    tournament_id: tournamentId,
                    match_id: matchId,
                    winning_team_id: selectedWalkoverTeam
                }
            });

            toast.success(response.message || "Walkover declared successfully");
            setScoreData(prev => ({
                ...prev,
                winner_team_id: selectedWalkoverTeam,
                is_final: true,
                status: 'completed',
                is_walkover: true,
                result_type: 'walkover'
            }));
            setMatchStatus('completed');
            setWalkoverModalOpen(false);
            setConfirmWalkoverStep(false);
            router.push(`/referee/${tournamentId}/matches`);
        } catch (error) {
            console.error("Failed to declare walkover:", error);
            toast.error(error.message || "Failed to declare walkover");
        } finally {
            setIsSubmittingWalkover(false);
        }
    };

    const handleStartMatch = async () => {
        try {
            await apiCall(`${endpoints.updateMatchStatus}/${matchId}`, {
                method: "POST",
                body: {
                    tournament_id: tournamentId,
                    status: "on-going"
                }
            });
            
            setMatchStatus('on-going');
            setShowStartModal(false);
            toast.success("Match started successfully");
        } catch (error) {
            console.error("Failed to start match:", error);
            toast.error(error.message || "Failed to start match");
        }
    };

    const handleBackToMatches = () => {
        router.push(`/referee/${tournamentId}/matches`);
    };

    const isCompleted = matchStatus === 'completed' || scoreData?.is_final === true;

    if (loading) {
        return <div className={stl.loading}>Loading match details...</div>;
    }

    if (!scoreData) {
        return <div className={stl.error}>No match data available</div>;
    }

    // Determine winner display names
    const winnerName = scoreData?.winner_team_id 
        ? (scoreData.winner_team_id === scoreData.team1?.team_id 
            ? (scoreData.team1?.name || `Team ${scoreData.team1?.team_id}`) 
            : (scoreData.team2?.name || `Team ${scoreData.team2?.team_id}`))
        : null;

    return (
        <div className={stl.container}>
            <div className={stl.header}>
                <button onClick={handleBackToMatches}>
                    <ArrowBackIcon />
                </button>
                <h2>{isCompleted ? "Match Result" : "Update Score"}</h2>
            </div>

            <div className={stl.matchInfo}>
                <div className={stl.infoItem}>
                    <span className={stl.label}>Status:</span>
                    <span className={`${stl.value} ${stl[matchStatus?.replace('-', '_')] || ''}`}>
                        {matchStatus ? matchStatus.charAt(0).toUpperCase() + matchStatus.slice(1) : 'Unknown'}
                    </span>
                </div>
                <div className={stl.infoItem}>
                    <span className={stl.label}>Tournament ID:</span>
                    <span className={stl.value}>{tournamentId}</span>
                </div>
                <div className={stl.infoItem}>
                    <span className={stl.label}>Match ID:</span>
                    <span className={stl.value}>{matchId}</span>
                </div>
            </div>

            {/* Walkover Banner */}
            {scoreData?.is_walkover && (
                <div className={stl.walkoverBanner}>
                    <span className={stl.walkoverBadge}>WALKOVER</span>
                    <span className={stl.winnerInfo}>
                        Winner: <strong>{winnerName}</strong> by Walkover
                    </span>
                </div>
            )}

            {/* Regular Completed Match Banner */}
            {isCompleted && !scoreData?.is_walkover && (
                <div className={stl.completedBanner}>
                    <span className={stl.completedBadge}>COMPLETED</span>
                    <span className={stl.winnerInfo}>
                        {winnerName ? (
                            <>Winner: <strong>{winnerName}</strong></>
                        ) : (
                            <>Match Result: <strong>Draw / Tied</strong></>
                        )}
                    </span>
                </div>
            )}

            <form onSubmit={formik.handleSubmit} className={stl.scoreForm}>
                <div className={stl.teams}>
                    <TeamCard
                        team={scoreData.team1}
                        players={scoreData.team1?.players || []}
                        onScoreChange={(change) => handleScoreChange("team1", change)}
                        onReset={() => resetScore("team1")}
                        formik={formik}
                        teamName="team1Score"
                        isWinner={scoreData.winner_team_id === scoreData.team1?.team_id}
                        isWalkover={scoreData.is_walkover}
                        isCompleted={isCompleted}
                    />

                    <div className={stl.vs}>VS</div>

                    <TeamCard
                        team={scoreData.team2}
                        players={scoreData.team2?.players || []}
                        onScoreChange={(change) => handleScoreChange("team2", change)}
                        onReset={() => resetScore("team2")}
                        formik={formik}
                        teamName="team2Score"
                        isWinner={scoreData.winner_team_id === scoreData.team2?.team_id}
                        isWalkover={scoreData.is_walkover}
                        isCompleted={isCompleted}
                    />
                </div>

                {/* When match is completed, action buttons are disabled and a return link is shown */}
                {isCompleted ? (
                    <div className={stl.completedNotice}>
                        <span>Match Finalized</span>
                        <button type="button" onClick={handleBackToMatches}>
                            Back to Matches
                        </button>
                    </div>
                ) : (
                    <div className={stl.actions}>
                        <button type="button" onClick={() => updateScore(false)}>Update</button>
                        <button type="button" onClick={finalizeScore}>Final</button>
                        <button type="button" className={stl.walkoverBtn} onClick={handleOpenWalkoverModal}>
                            Declare Walkover
                        </button>
                    </div>
                )}
            </form>

            {isModalOpen && (
                <div className={stl.modal}>
                    <div className={stl.modalContent}>
                        <p>Are you sure you want to finalize the scores?</p>
                        <button onClick={confirmFinalize} style={{ backgroundColor: '#4CAF50', color: 'white' }}>Confirm</button>
                        <button onClick={() => setModalOpen(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Walkover Dialog */}
            <Dialog 
                open={isWalkoverModalOpen} 
                onClose={() => setWalkoverModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Declare Match Walkover</DialogTitle>
                <DialogContent>
                    {!confirmWalkoverStep ? (
                        <div>
                            <p style={{ marginBottom: '1rem', color: '#555', fontSize: '0.95rem' }}>
                                Select the winning team. A walkover immediately finalizes the match and advances the winner without fabricating artificial scores.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                                <div 
                                    onClick={() => setSelectedWalkoverTeam(scoreData.team1?.team_id)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: `2px solid ${selectedWalkoverTeam === scoreData.team1?.team_id ? '#e65100' : '#ddd'}`,
                                        backgroundColor: selectedWalkoverTeam === scoreData.team1?.team_id ? '#fff3e0' : '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: '1rem', color: '#222' }}>Team {scoreData.team1?.team_id}: {scoreData.team1?.name}</strong>
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#666' }}>
                                            {scoreData.team1?.players?.map(p => `${p.first_name} ${p.last_name}`).join(' & ')}
                                        </p>
                                    </div>
                                    {selectedWalkoverTeam === scoreData.team1?.team_id && (
                                        <span style={{ color: '#e65100', fontWeight: 'bold' }}>✓ Selected Winner</span>
                                    )}
                                </div>

                                <div 
                                    onClick={() => setSelectedWalkoverTeam(scoreData.team2?.team_id)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: `2px solid ${selectedWalkoverTeam === scoreData.team2?.team_id ? '#e65100' : '#ddd'}`,
                                        backgroundColor: selectedWalkoverTeam === scoreData.team2?.team_id ? '#fff3e0' : '#fff',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: '1rem', color: '#222' }}>Team {scoreData.team2?.team_id}: {scoreData.team2?.name}</strong>
                                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#666' }}>
                                            {scoreData.team2?.players?.map(p => `${p.first_name} ${p.last_name}`).join(' & ')}
                                        </p>
                                    </div>
                                    {selectedWalkoverTeam === scoreData.team2?.team_id && (
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
                                ⚠️ This will finalize the match and advance Team {selectedWalkoverTeam} to the next tournament round.
                            </p>
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setWalkoverModalOpen(false)} style={{ color: '#666' }}>
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
                                onClick={submitWalkover} 
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

            {/* Start Match Dialog for Pending Matches Only */}
            <Dialog 
                open={showStartModal} 
                onClose={() => setShowStartModal(false)}
            >
                <DialogTitle>Match Not Started</DialogTitle>
                <DialogContent>
                    <p>This match hasn't started yet. Would you like to start the match?</p>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setShowStartModal(false)}
                        style={{ color: '#F28C28' }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleStartMatch}
                        style={{ color: '#4CAF50' }}
                    >
                        Start Match
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

const TeamCard = ({ team, players = [], onScoreChange, onReset, formik, teamName, isWinner, isWalkover, isCompleted }) => (
    <div className={`${stl.teamCard} ${isWinner ? stl.winnerCard : ''}`}>
        <div className={stl.teamHeader}>
            <h4>Team {team?.team_id || 'Unknown'} {isWinner ? '👑' : ''}</h4>
            {isWalkover && (
                <div style={{ margin: '0.25rem 0', fontWeight: 'bold', fontSize: '0.85rem', color: isWinner ? '#2e7d32' : '#c62828' }}>
                    {isWinner ? '★ WALKOVER WINNER' : 'CONCEDED / ABSENT'}
                </div>
            )}
            {isCompleted && !isWalkover && isWinner && (
                <div style={{ margin: '0.25rem 0', fontWeight: 'bold', fontSize: '0.85rem', color: '#2e7d32' }}>
                    ★ MATCH WINNER
                </div>
            )}
            <div className={stl.playerNames}>
                {players.map((player, index) => (
                    <p key={index} className={stl.playerName}>
                        {player.first_name} {player.last_name}
                        {index < players.length - 1 ? " & " : ""}
                    </p>
                ))}
            </div>
        </div>
        
        {isWalkover ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#666', fontStyle: 'italic', fontSize: '0.95rem' }}>
                {isWinner ? 'Advanced by Walkover' : 'No score recorded'}
            </div>
        ) : isCompleted ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: isWinner ? '#2e7d32' : '#333' }}>
                    {formik.values[teamName]}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>Final Score</div>
            </div>
        ) : (
            <>
                <TextField
                    size="small"
                    className={stl.score}
                    value={formik.values[teamName]}
                    onChange={(e) => formik.setFieldValue(teamName, Math.max(0, Number(e.target.value) || 0))}
                    error={Boolean(formik.errors[teamName])}
                    helperText={formik.errors[teamName]}
                />
                
                <div className={stl.scoreControls}>
                    <button type="button" onClick={() => onScoreChange(1)}>+1</button>
                    <button type="button" onClick={() => onScoreChange(-1)}>-1</button>
                    <button type="button" className={stl.reset} onClick={onReset}>Reset</button>
                </div>
            </>
        )}
    </div>
);

export default MatchScreen;
