import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WatchedTab from './tabs/watchedTab';
import PlannedTab from './tabs/plannedTab';
import RecommendationsTab from './tabs/recommendationsTab';

type TabParamList = {
  Watched: undefined;
  Planned: undefined;
  Recommendations: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const Home: React.FC = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Watched" component={WatchedTab} />
      <Tab.Screen name="Planned" component={PlannedTab} />
      <Tab.Screen name="Recommendations" component={RecommendationsTab} />
    </Tab.Navigator>
  );
};

export default Home;
