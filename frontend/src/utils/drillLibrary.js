/**
 * drillLibrary.js — Standardized Sports Combine Drills
 *
 * Each drill has:
 *   id       — unique key
 *   label    — display name
 *   icon     — emoji
 *   trackAs  — maps to pose-tracking engine ('jump', 'sprint', 'agility', etc.)
 *   trackLabel — short description of what is tracked
 */

export const DRILL_LIBRARY = {
    vertical_jump: {
        id: 'vertical_jump', label: 'Vertical Jump', icon: '🚀',
        ytId: 'CVaEhXotL7M', trackAs: 'jump', trackLabel: 'Max hip displacement / Power',
        description: 'Measures lower-body explosive power. Stand still, then gather and jump as high as possible.'
    },
    sprint_40_yard: {
        id: 'sprint_40_yard', label: '40-Yard Sprint', icon: '⚡',
        ytId: 'DqH2m1O18qg', trackAs: 'sprint', trackLabel: 'Acceleration & Max Speed',
        description: 'Measures acceleration and top speed. Start from a sprinters stance and run max effort.'
    },
    broad_jump: {
        id: 'broad_jump', label: 'Broad Jump', icon: '🏃‍♂️',
        ytId: 'YaXPRqUwItQ', trackAs: 'jump', trackLabel: 'Forward displacement / Power',
        description: 'Measures horizontal explosive power. Jump forward as far as possible from a standstill.'
    },
    agility_cone_drill: {
        id: 'agility_cone_drill', label: 'Agility Cone Drill', icon: '⛷',
        ytId: '4A2S_IomG-U', trackAs: 'agility', trackLabel: 'Lateral shift velocity & change of direction',
        description: 'Measures lateral agility and ability to change directions rapidly.'
    },
    reaction_time_test: {
        id: 'reaction_time_test', label: 'Reaction Time Test', icon: '⚡',
        ytId: 'iSSAk4XCsZg', trackAs: 'reaction', trackLabel: 'Time to initial movement',
        description: 'Measures cognitive processing and initial explosive step reaction speed.'
    },
    lateral_movement_test: {
        id: 'lateral_movement_test', label: 'Lateral Movement Test', icon: '↔️',
        ytId: 'K7S71k9X8nE', trackAs: 'agility', trackLabel: 'Lateral velocity & efficiency',
        description: 'Measures side-to-side movement speed and hip fluidity.'
    }
};

/**
 * getDrills() → array of all available sports combine drills
 */
export function getDrills() {
    return Object.values(DRILL_LIBRARY);
}
