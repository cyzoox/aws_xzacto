import {createSelector} from '@reduxjs/toolkit';

// Basic selector to get the staff slice from the state
const selectStaffSlice = state => state.staff;

// Basic selector to get the currentUserId from props (will be passed in)
const selectCurrentUserId = (state, currentUserId) => currentUserId;

// Memoized selector to get all staff items
export const selectAllStaff = createSelector(
  [selectStaffSlice],
  staffSlice => staffSlice.items || [],
);

// Memoized selector to filter staff by the current user's ID
export const selectStaffByOwner = createSelector(
  [selectAllStaff, selectCurrentUserId],
  (allStaff, currentUserId) => {
    if (!currentUserId) {
      return [];
    }
    return allStaff.filter(s => s.ownerId === currentUserId && !s._deleted);
  },
);
