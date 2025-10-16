import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
  Text,
  TextInput,
  Picker,
  TouchableOpacity,
  Linking,
  Platform,
  ScrollView,
  Switch
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const BACKEND_URL = 'http://10.0.2.2:3000'; // Ajuste conforme ambiente

const tipos = [
  { label: 'Todos', value: '' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Rua', value: 'rua' },
  { label: 'Outro', value: 'outro' }
];

export default function App() {
  const [vagas, setVagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [tipo, setTipo] = useState('');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [vagasMin, setVagasMin] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [selectedEstacionamento, setSelectedEstacionamento] = useState(null);

  const locationSubscription = useRef(null);

  // Atualização em tempo real da localização do usuário
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Não foi possível acessar sua localização.');
        setLoading(false);
        return;
      }
      // Atualiza posição em tempo real
      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 2 },
        (location) => {
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    })();
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Busca vagas sempre que filtros ou localização mudam
  useEffect(() => {
    if (!userLocation) return;

    // Validação de entrada numérica
    const precoMinVal = precoMin === '' || !isNaN(Number(precoMin)) ? precoMin : '';
    const precoMaxVal = precoMax === '' || !isNaN(Number(precoMax)) ? precoMax : '';
    const vagasMinVal = vagasMin === '' || !isNaN(Number(vagasMin)) ? vagasMin : '';

    setLoading(true);
    const params = [
      `lat=${userLocation.latitude}`,
      `lng=${userLocation.longitude}`,
      tipo ? `tipo=${tipo}` : '',
      precoMinVal ? `preco_min=${precoMinVal}` : '',
      precoMaxVal ? `preco_max=${precoMaxVal}` : '',
      vagasMinVal ? `vagas_min=${vagasMinVal}` : ''
    ].filter(Boolean).join('&');
    fetch(`${BACKEND_URL}/api/vagas-proximas?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setVagas(data);
        setLoading(false);
      })
      .catch((err) => {
        Alert.alert('Erro', 'Não foi possível buscar vagas próximas.');
        setLoading(false);
      });
  }, [userLocation, tipo, precoMin, precoMax, vagasMin]);

  // Limpa estacionamento selecionado ao mudar filtros
  useEffect(() => {
    setSelectedEstacionamento(null);
  }, [tipo, precoMin, precoMax, vagasMin]);

  if (loading || !userLocation) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" accessibilityLabel="Carregando mapa" />;
  }

  // Função para abrir rota no Google Maps
  const openRoute = (vaga) => {
    const url = Platform.select({
      ios: `maps://app?saddr=${userLocation.latitude},${userLocation.longitude}&daddr=${vaga.latitude},${vaga.longitude}`,
      android: `https://www.google.com/maps/dir/?api=1&origin=${userLocation.latitude},${userLocation.longitude}&destination=${vaga.latitude},${vaga.longitude}`
    });
    Linking.openURL(url);
  };

  // Aumentar/diminuir fonte
  const changeFontSize = (delta) => {
    setFontSize((size) => Math.max(12, Math.min(28, size + delta)));
  };

  // Estilos dinâmicos para acessibilidade
  const dynamicStyles = StyleSheet.create({
    label: {
      fontSize,
      color: highContrast ? '#000' : '#004aad',
      fontWeight: 'bold',
      marginBottom: 2,
    },
    input: {
      fontSize,
      backgroundColor: highContrast ? '#fff' : '#f7faff',
      color: highContrast ? '#000' : '#222',
      borderColor: highContrast ? '#000' : '#b3c6ff',
      borderWidth: 1.5,
      borderRadius: 6,
      padding: 6,
      marginBottom: 8,
    },
    button: {
      backgroundColor: highContrast ? '#000' : '#0072ff',
      padding: 10,
      borderRadius: 6,
      alignItems: 'center',
      marginVertical: 5,
    },
    buttonText: {
      color: highContrast ? '#fff' : '#fff',
      fontSize,
      fontWeight: 'bold',
    }
  });

  return (
    <View style={{ flex: 1, backgroundColor: highContrast ? '#fff' : '#e0e7ff' }}>
      <ScrollView
        style={{ padding: 10, backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingBottom: 10 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={dynamicStyles.label} accessibilityLabel="Filtros de busca">Filtros:</Text>
        <Text style={dynamicStyles.label}>Tipo:</Text>
        <Picker
          selectedValue={tipo}
          onValueChange={setTipo}
          style={[dynamicStyles.input, { height: 40 }]}
          accessibilityLabel="Filtrar por tipo de estacionamento"
        >
          {tipos.map((t) => (
            <Picker.Item key={t.value} label={t.label} value={t.value} />
          ))}
        </Picker>
        <Text style={dynamicStyles.label}>Preço mínimo:</Text>
        <TextInput
          style={dynamicStyles.input}
          keyboardType="numeric"
          value={precoMin}
          onChangeText={setPrecoMin}
          placeholder="Ex: 5"
          accessibilityLabel="Preço mínimo"
        />
        <Text style={dynamicStyles.label}>Preço máximo:</Text>
        <TextInput
          style={dynamicStyles.input}
          keyboardType="numeric"
          value={precoMax}
          onChangeText={setPrecoMax}
          placeholder="Ex: 20"
          accessibilityLabel="Preço máximo"
        />
        <Text style={dynamicStyles.label}>Vagas mínimas:</Text>
        <TextInput
          style={dynamicStyles.input}
          keyboardType="numeric"
          value={vagasMin}
          onChangeText={setVagasMin}
          placeholder="Ex: 1"
          accessibilityLabel="Vagas mínimas"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 5 }}>
          <Text style={dynamicStyles.label}>Alto contraste</Text>
          <Switch
            value={highContrast}
            onValueChange={setHighContrast}
            accessibilityLabel="Ativar alto contraste"
          />
          <TouchableOpacity
            onPress={() => changeFontSize(2)}
            style={dynamicStyles.button}
            accessibilityLabel="Aumentar fonte"
            accessibilityRole="button"
          >
            <Text style={dynamicStyles.buttonText}>A+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => changeFontSize(-2)}
            style={dynamicStyles.button}
            accessibilityLabel="Diminuir fonte"
            accessibilityRole="button"
          >
            <Text style={dynamicStyles.buttonText}>A-</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <MapView
        style={styles.map}
        region={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation={true}
        accessibilityLabel="Mapa de estacionamentos"
        customMapStyle={highContrast ? [
          { elementType: 'geometry', stylers: [{ color: '#000' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#fff' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#000' }] }
        ] : []}
      >
        {vagas.map((vaga) => (
          <Marker
            key={vaga.id}
            coordinate={{
              latitude: vaga.latitude,
              longitude: vaga.longitude,
            }}
            pinColor={highContrast ? '#000' : '#0072ff'}
            title={vaga.nome}
            description={`Vagas livres: ${vaga.vagas_livres}/${vaga.capacidade_total}\nPreço: R$ ${vaga.preco.toFixed(2)}`}
            onPress={() => setSelectedEstacionamento(vaga)}
            accessibilityLabel={`Estacionamento ${vaga.nome}`}
          />
        ))}
      </MapView>
      {selectedEstacionamento && (
        <View style={{
          position: 'absolute',
          bottom: 20,
          left: 10,
          right: 10,
          backgroundColor: highContrast ? '#fff' : '#f7faff',
          borderRadius: 10,
          padding: 15,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5,
        }}>
          <Text style={[dynamicStyles.label, { fontSize: fontSize + 2 }]}>{selectedEstacionamento.nome}</Text>
          <Text style={{ fontSize }}>Vagas livres: {selectedEstacionamento.vagas_livres}/{selectedEstacionamento.capacidade_total}</Text>
          <Text style={{ fontSize }}>Preço: R$ {selectedEstacionamento.preco.toFixed(2)}</Text>
          <TouchableOpacity
            style={dynamicStyles.button}
            onPress={() => openRoute(selectedEstacionamento)}
            accessibilityLabel="Abrir rota no Google Maps"
          >
            <Text style={dynamicStyles.buttonText}>Ver rota no Google Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.button, { backgroundColor: '#aaa', marginTop: 5 }]}
            onPress={() => setSelectedEstacionamento(null)}
            accessibilityLabel="Fechar detalhes"
          >
            <Text style={dynamicStyles.buttonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.6,
    flex: 1,
  },
});