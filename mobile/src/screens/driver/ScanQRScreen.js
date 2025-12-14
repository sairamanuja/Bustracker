import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, Title } from 'react-native-paper';
import { driverAPI } from '../../services/api';

export default function ScanQRScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [barcodeAvailable, setBarcodeAvailable] = useState(false);
  const [BarCodeScanner, setBarCodeScanner] = useState(null);

  useEffect(() => {
    // Check if barcode scanner is available without importing it
    // Since expo-barcode-scanner requires custom build, we'll use fallback
    setBarcodeAvailable(false);
    setHasPermission(false);
  }, []);

  const requestPermission = async (Scanner = BarCodeScanner) => {
    if (!Scanner) {
      setHasPermission(false);
      return;
    }
    try {
      const { status } = await Scanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
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

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  // Handle missing barcode scanner module
  if (!barcodeAvailable) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>QR Scanner Not Available</Title>
            <Text style={styles.text}>
              The barcode scanner requires a custom development build.{'\n\n'}
              For now, you can manually enter the booking QR code.
            </Text>
            <Button
              mode="contained"
              onPress={() => {
                Alert.prompt(
                  'Enter QR Code',
                  'Please enter the booking QR code:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Verify',
                      onPress: async (qrCode) => {
                        if (qrCode) {
                          handleBarCodeScanned({ type: 'qr', data: qrCode });
                        }
                      }
                    }
                  ],
                  'plain-text'
                );
              }}
              style={styles.button}
            >
              Enter QR Code Manually
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={[styles.button, { marginTop: 10 }]}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>Camera Permission Required</Title>
            <Text style={styles.text}>
              Please grant camera permission to scan QR codes
            </Text>
            <Button
              mode="contained"
              onPress={requestPermission}
              style={styles.button}
            >
              Grant Permission
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  if (!BarCodeScanner) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title>QR Scanner Not Available</Title>
            <Text style={styles.text}>
              The barcode scanner requires a custom development build.{'\n\n'}
              For now, you can manually enter the booking QR code.
            </Text>
            <Button
              mode="contained"
              onPress={() => {
                Alert.prompt(
                  'Enter QR Code',
                  'Please enter the booking QR code:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Verify',
                      onPress: async (qrCode) => {
                        if (qrCode) {
                          handleBarCodeScanned({ type: 'qr', data: qrCode });
                        }
                      }
                    }
                  ],
                  'plain-text'
                );
              }}
              style={styles.button}
            >
              Enter QR Code Manually
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={[styles.button, { marginTop: 10 }]}
            >
              Go Back
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
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
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
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
});
