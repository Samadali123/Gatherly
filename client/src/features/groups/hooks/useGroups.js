import { useState } from 'react';
import api from '../../../services/api';
import { socket } from '../../../services/socket';
import { useChatStore, useUiStore } from '../../chat/chatStore';

export const useGroups = () => {
  const [loading, setLoading] = useState(false);
  const { upsertGroup } = useChatStore();
  const { pushToast } = useUiStore();

  const createGroup = async (groupName) => {
    setLoading(true);
    try {
      const response = await api.post('/groups', { groupName });
      upsertGroup(response.data.data);
      socket.emit('create-new-group', { groupName });
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to create group', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupName) => {
    setLoading(true);
    try {
      const response = await api.post('/groups/join', { groupName });
      upsertGroup(response.data.data);
      socket.emit('join-group', { groupName });
    } catch (error) {
      pushToast(error.response?.data?.message || 'Unable to join group', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createGroup,
    joinGroup,
  };
};
