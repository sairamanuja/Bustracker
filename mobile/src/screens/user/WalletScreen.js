import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Title, Text, Button, TextInput, Portal, Modal } from 'react-native-paper';
import { userAPI, walletAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function WalletScreen() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [adding, setAdding] = useState(false);
  const { user, updateUser } = useAuth();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getWalletTransactions({ limit: 50 });
      setTransactions(response.data.transactions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMoney = async () => {
    const value = parseFloat(amount);

    if (!value || value <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (value > 10000) {
      Alert.alert('Error', 'Maximum amount per transaction is $10,000');
      return;
    }

    setAdding(true);
    try {
      await walletAPI.addMoney(value);
      await updateUser();
      Alert.alert('Success', `$${value} added to your wallet`);
      setAmount('');
      setShowAddMoney(false);
      loadTransactions();
    } catch (error) {
      Alert.alert('Error', 'Failed to add money');
    } finally {
      setAdding(false);
    }
  };

  const renderTransaction = ({ item }) => (
    <Card style={styles.transactionCard}>
      <Card.Content>
        <View style={styles.transactionHeader}>
          <View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={[
              styles.amount,
              { color: item.type === 'credit' ? '#4CAF50' : '#F44336' }
            ]}>
              {item.type === 'credit' ? '+' : '-'}${item.amount}
            </Text>
            <Text style={styles.balance}>
              Balance: ${item.balanceAfter}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.balanceCard}>
        <Card.Content>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Title style={styles.balanceAmount}>${user?.walletBalance || 0}</Title>
          <Button
            mode="contained"
            onPress={() => setShowAddMoney(true)}
            style={styles.addButton}
          >
            Add Money
          </Button>
        </Card.Content>
      </Card>

      <Text style={styles.sectionTitle}>Transaction History</Text>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTransactions} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />

      <Portal>
        <Modal
          visible={showAddMoney}
          onDismiss={() => setShowAddMoney(false)}
          contentContainerStyle={styles.modal}
        >
          <Title>Add Money to Wallet</Title>
          <Text style={styles.modalText}>
            Enter the amount you want to add (Max: $10,000)
          </Text>

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Affix text="$" />}
          />

          <View style={styles.quickAmounts}>
            {[10, 50, 100, 500].map((value) => (
              <Button
                key={value}
                mode="outlined"
                onPress={() => setAmount(value.toString())}
                style={styles.quickButton}
              >
                ${value}
              </Button>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setShowAddMoney(false)}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddMoney}
              loading={adding}
              disabled={adding}
              style={styles.confirmButton}
            >
              Add ${amount || '0'}
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  balanceCard: {
    margin: 15,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#4CAF50',
    marginVertical: 10,
  },
  addButton: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 15,
    marginTop: 10,
    marginBottom: 10,
  },
  list: {
    paddingHorizontal: 15,
  },
  transactionCard: {
    marginBottom: 10,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  balance: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalText: {
    marginVertical: 10,
    color: '#666',
  },
  input: {
    marginTop: 10,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  quickButton: {
    flex: 1,
    marginHorizontal: 3,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    flex: 1,
  },
});
