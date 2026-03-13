import { useState, useRef, useCallback } from 'react';

// ── Biomechanical Proxy Tracking ─────────────────────────────────
// Since 2D webcams lack true depth/spatial awareness, we use changes in 
// normalized landmark coordinates to approximate velocity, displacement, and power.

export function useMetricsTracker(drillType = 'jump') {
    const [metrics, setMetrics] = useState({
        maxVelocity: 0,
        maxVerticalVelocity: 0,
        maxHorizontalVelocity: 0,
        time: 0,
        postureScore: 100
    });

    const [feedback, setFeedback] = useState('Get into position…');
    const [phase, setPhase] = useState('IDLE'); // IDLE, ACTIVE, COMPLETE
    const phaseRef = useRef('IDLE');

    const previousPoseRef = useRef(null);
    const maxVelRef = useRef(0);
    const maxVVelRef = useRef(0);
    const maxHVelRef = useRef(0);
    const startTimeRef = useRef(null);
    const postureHistoryRef = useRef([]);
    const outOfFrameRef = useRef(false);

    const processLandmarks = useCallback((landmarks) => {
        if (!landmarks || landmarks.length === 0) return;

        // Identify necessary landmarks
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        if (!leftHip || !rightHip || !leftShoulder || !rightShoulder) return;

        // Ensure key body parts are visible
        const checkVisible = (lm) => {
            if (!lm) return false;
            // MediaPipe provides visibility score (0.0 to 1.0)
            if (lm.visibility !== undefined) return lm.visibility > 0.65;
            return true;
        };

        const coreVisible = checkVisible(leftHip) && checkVisible(rightHip) &&
            checkVisible(leftShoulder) && checkVisible(rightShoulder);

        // Depending on drillType, lower body might be required
        let legsVisible = true;
        if (drillType === 'jump' || drillType === 'agility' || drillType === 'sprint') {
            legsVisible = (checkVisible(leftKnee) || checkVisible(rightKnee)) &&
                (checkVisible(leftAnkle) || checkVisible(rightAnkle));
        }

        if (!coreVisible || !legsVisible) {
            if (!outOfFrameRef.current) {
                setFeedback('⚠️ Please ensure your full body is visible in the frame.');
                outOfFrameRef.current = true;
            }
            previousPoseRef.current = null; // Reset to avoid jumpy velocity on reentry
            return;
        } else {
            if (outOfFrameRef.current) {
                setFeedback(phaseRef.current === 'ACTIVE' ? '🟡 Drill Active | Capturing Movement...' : 'Get into position…');
                outOfFrameRef.current = false;
            }
        }

        const hipCenterY = (leftHip.y + rightHip.y) / 2;
        const hipCenterX = (leftHip.x + rightHip.x) / 2;

        const currentPose = { x: hipCenterX, y: hipCenterY, time: Date.now() };

        if (!previousPoseRef.current) {
            previousPoseRef.current = currentPose;
            return;
        }

        const prevPose = previousPoseRef.current;
        const dt = (currentPose.time - prevPose.time) / 1000; // time delta in seconds

        if (dt > 0) {
            // Calculate pixel velocity (normalized)
            const dx = Math.abs(currentPose.x - prevPose.x);
            const dy = Math.abs(currentPose.y - prevPose.y);

            // For jumps, vertical velocity matters. For sprints/agility, displacement matters.
            let velocity = 0;
            if (drillType === 'jump') velocity = dy / dt;
            else if (drillType === 'agility' || drillType === 'reaction') velocity = dx / dt;
            else velocity = Math.sqrt(dx * dx + dy * dy) / dt;

            // Smooth the velocity a bit to avoid jitter spikes
            const smoothedVelocity = velocity * 100; // scale up for humans

            // Track peak velocities per axis
            const currentVX = dx / dt * 100;
            const currentVY = dy / dt * 100;

            if (currentVX > maxHVelRef.current) maxHVelRef.current = currentVX;
            if (currentVY > maxVVelRef.current) maxVVelRef.current = currentVY;

            if (smoothedVelocity > maxVelRef.current) {
                maxVelRef.current = smoothedVelocity;
            }

            // Start timer if significant movement detected
            const overallMotion = Math.sqrt(dx * dx + dy * dy) / dt * 100;
            if (phaseRef.current === 'IDLE' && overallMotion > 15) {
                setPhase('ACTIVE');
                phaseRef.current = 'ACTIVE';
                startTimeRef.current = Date.now();
                setFeedback('🟡 Drill Active | Capturing Movement...');
            }

            if (phaseRef.current === 'ACTIVE') {
                const elapsed = (Date.now() - startTimeRef.current) / 1000;

                // Form score simulation based on shoulder alignment
                const leftShoulder = landmarks[11];
                const rightShoulder = landmarks[12];
                let currentPosture = 100;
                if (leftShoulder && rightShoulder) {
                    const shoulderTilt = Math.abs(leftShoulder.y - rightShoulder.y);
                    if (shoulderTilt > 0.1) currentPosture -= (shoulderTilt * 100);
                }
                postureHistoryRef.current.push(currentPosture);

                const avgPosture = Math.round(
                    postureHistoryRef.current.reduce((a, b) => a + b, 0) / postureHistoryRef.current.length
                );

                setMetrics({
                    maxVelocity: Math.round(maxVelRef.current),
                    maxVerticalVelocity: Math.round(maxVVelRef.current),
                    maxHorizontalVelocity: Math.round(maxHVelRef.current),
                    time: elapsed.toFixed(1),
                    postureScore: avgPosture
                });
            }
        }

        previousPoseRef.current = currentPose;

    }, [drillType]);

    const stopTracking = useCallback(() => {
        setPhase('COMPLETE');
        phaseRef.current = 'COMPLETE';
        setFeedback('✔ Assessment Complete. Gathering Metrics.');
    }, []);

    const reset = useCallback(() => {
        setMetrics({ maxVelocity: 0, time: 0, postureScore: 100 });
        setFeedback('Get into position…');
        setPhase('IDLE');
        phaseRef.current = 'IDLE';
        previousPoseRef.current = null;
        maxVelRef.current = 0;
        maxVVelRef.current = 0;
        maxHVelRef.current = 0;
        startTimeRef.current = null;
        postureHistoryRef.current = [];
        outOfFrameRef.current = false;
    }, []);

    return { metrics, feedback, phase, stopTracking, processLandmarks, reset };
}
