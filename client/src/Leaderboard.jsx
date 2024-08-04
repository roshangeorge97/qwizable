import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const leaderboardData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaderboard(leaderboardData);
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard-container">
      <h2 >Leaderboard</h2>
      <ol>
        {leaderboard.map(user => (
          <li key={user.id}>{user.email}: {user.totalPoints} points</li>
        ))}
      </ol>
    </div>
  );
};

export default Leaderboard;