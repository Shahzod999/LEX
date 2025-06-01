import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

interface LocationState {
  location: Location.LocationObject | null;
  address: string | null;
  error: string | null;
  loading: boolean;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    address: null,
    error: null,
    loading: false,
  });
  
  const hasRequestedLocation = useRef(false);

  const getCurrentLocation = async () => {
    if (hasRequestedLocation.current) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    hasRequestedLocation.current = true;

    try {
      // Запрашиваем разрешение на доступ к геолокации
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const errorMessage = 'Доступ к геолокации запрещен';
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          loading: false 
        }));
        Alert.alert(
          'Ошибка',
          'Для получения актуальных новостей требуется доступ к вашему местоположению'
        );
        return;
      }

      // Получаем текущее местоположение
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Получаем адрес по координатам
      let formattedAddress = null;
      try {
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
        
        if (addressResponse.length > 0) {
          const { city, country, region } = addressResponse[0];
          formattedAddress = [city, region, country].filter(Boolean).join(', ');
        }
      } catch (addressError) {
        console.warn('Не удалось получить адрес:', addressError);
      }

      setState({
        location: currentLocation,
        address: formattedAddress,
        error: null,
        loading: false,
      });

      console.log('Локация пользователя:', {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
        address: formattedAddress,
      });

    } catch (error) {
      const errorMessage = 'Ошибка получения геолокации';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        loading: false 
      }));
      console.error('Ошибка получения локации:', error);
      Alert.alert('Ошибка', 'Не удалось получить ваше местоположение');
    }
  };

  const getCoordinates = (): LocationCoords | null => {
    if (!state.location) return null;
    
    return {
      latitude: state.location.coords.latitude,
      longitude: state.location.coords.longitude,
      accuracy: state.location.coords.accuracy,
    };
  };

  const getAddressString = (): string | null => {
    return state.address;
  };

  const resetLocation = () => {
    hasRequestedLocation.current = false;
    setState({
      location: null,
      address: null,
      error: null,
      loading: false,
    });
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  return {
    ...state,
    getCurrentLocation,
    getCoordinates,
    getAddressString,
    resetLocation,
  };
}; 