import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TextInput } from 'react-native';
import { Text, Button, Card, Title } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { driverAPI } from '../../services/api';

export default function ScanQRScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [manualQRCode, setManualQRCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  useEffect(() => {
    // Request permission on mount
    if (permission && !permission.granted && !permission.canAskAgain) {
      // Permission denied permanently
    }
  }, [permission]);

  const handleManualVerification = async () => {
    if (!manualQRCode.trim()) {
      Alert.alert('Error', 'Please enter a QR code');
      return;
    }
    await handleBarCodeScanned({ type: 'qr', data: manualQRCode.trim() });
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return; // Prevent multiple scans
    
    setScanned(true);
    setVerifying(true);

    try {
      const response = await driverAPI.verifyBookingQR(data);
      const booking = response.data.booking;

      Alert.alert(
        'Booking Verified! ✓',
        `Passenger: ${booking.userName}\nPhone: ${booking.userPhone}\nPrice: $${booking.price}\n\nPickup: ${booking.pickupLocation.address}\nDropoff: ${booking.dropoffLocation.address}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setVerifying(false);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error.response?.data?.error || 'Invalid QR code or booking already verified',
        [
          {
            text: 'Scan Again',
            onPress: () => {
              setScanned(false);
              setVerifying(false);
            }
          },
          { text: 'Cancel', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  // Show loading while checking permission
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Show permission request screen
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Camera Permission Required</Title>
            <Text style={styles.text}>
              Please grant camera permission to scan QR codes, or enter the QR code manually.
            </Text>
            <Button
              mode="contained"
              onPress={requestPermission}
              style={styles.button}
            >
              Grant Permission
            </Button>
            <Button
              mode="outlined"
              onPress={() => setShowManualInput(true)}
              style={[styles.button, { marginTop: 10 }]}
              icon="keyboard"
            >
              Enter QR Code Manually
            </Button>
            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              style={[styles.button, { marginTop: 5 }]}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // Show manual input overlay if requested
  if (showManualInput) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Enter QR Code Manually</Title>
            <Text style={styles.text}>
              Type or paste the booking QR code below:
            </Text>
            
            <View style={styles.manualInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter QR Code"
                value={manualQRCode}
                onChangeText={setManualQRCode}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
                editable={!verifying}
              />
              <View style={styles.inputButtons}>
                <Button
                  mode="contained"
                  onPress={handleManualVerification}
                  disabled={verifying || !manualQRCode.trim()}
                  loading={verifying}
                  style={styles.verifyButton}
                >
                  Verify
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowManualInput(false);
                    setManualQRCode('');
                  }}
                  style={styles.cancelButton}
                  disabled={verifying}
                >
                  Cancel
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // Show camera scanner
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>

      <Card style={styles.instructionCard}>
        <Card.Content>
          <Title style={styles.instructionTitle}>Scan QR Code</Title>
          <Text style={styles.instructionText}>
            {verifying
              ? 'Verifying booking...'
              : 'Align the QR code within the frame to scan'}
          </Text>
          {scanned && !verifying && (
            <Button
              mode="outlined"
              onPress={() => setScanned(false)}
              style={styles.rescanButton}
            >
              Scan Again
            </Button>
          )}
          <Button
            mode="text"
            onPress={() => setShowManualInput(true)}
            style={styles.manualButton}
            icon="keyboard"
          >
            Enter Manually Instead
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    padding: 20,
    margin: 20,
  },
  text: {
    marginVertical: 15,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  instructionCard: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    elevation: 4,
  },
  instructionTitle: {
    textAlign: 'center',
    fontSize: 18,
  },
  instructionText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
  rescanButton: {
    marginTop: 15,
  },
  manualButton: {
    marginTop: 10,
  },
  manualInputContainer: {
    marginTop: 20,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    color: '#000',
  },
  inputButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  verifyButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
});
