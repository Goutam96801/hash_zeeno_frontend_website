import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import axios from "axios";
import io from 'socket.io-client';

const HomePage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [map, setMap] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);

  // Establish WebSocket connection
  useEffect(() => {
    const socket = io('https://hash-zeeno-backend-tayd.vercel.app');  // Ensure the port matches your backend

    // Listen for SOS alerts
    socket.on('sosAlert', (data) => {
      alert(`SOS Alert!\nName: ${data.name}\nEmail: ${data.email}\nMobile: ${data.mobileNumber}\nMessage: ${data.message}\nLocation: ${data.location}`);
    });

    return () => {
      socket.disconnect();  // Clean up the connection on component unmount
    };
  }, []);

  // Fetch users from the server
  const fetchUsers = async () => {
    try {
      const response = await axios.get('https://hash-zeeno-backend-tayd.vercel.app/getAllUsers');
      setUsers(response.data);
      console.log(response.data);  // Corrected: Log the response data directly
    } catch (err) {
      console.log("Error fetching users", err);
    }
  };

  useEffect(() => {
    fetchUsers();

    // Get the user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error getting current location", error);
      }
    );
  }, []);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAxjR8TD-ne50Ow_csKW-nNn_M-Tl0Ta84"
  });

  const containerStyle = {
    width: '600px',
    height: '500px'
  };

  // Default center or selected user’s last location
  const center = selectedUser?.lastLocation
    ? { lat: selectedUser.lastLocation.latitude, lng: selectedUser.lastLocation.longitude }
    : { lat: 0, lng: 0 };

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, [center]);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const calculateRoute = () => {
    if (currentLocation && selectedUser?.lastLocation) {
      const origin = currentLocation;
      const destination = {
        lat: selectedUser.lastLocation.latitude,
        lng: selectedUser.lastLocation.longitude,
      };

      setDirectionsResponse(null);  // Reset directions before calculating new ones
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
          } else {
            console.error(`error fetching directions ${result}`);
          }
        }
      );
    }
  };

  return (
    <div className="">
      <div className="flex min-h-screen w-full relative">
        <aside className="absolute left-0 border-r w-64 p-4 gap-4">
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">User Status</h2>
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium">
                <i className="fi fi-rr-search"></i>
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto h-[90vh]">
              {users.map((user) => (
                <button
                  key={user._id}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-muted transition"
                  onClick={() => handleUserSelect(user)} // Corrected
                >
                  <span className="relative flex rounded-full w-4 h-4">
                    <i className="fi fi-tr-circle-user"></i>
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.isOnline ? "Online" : "Offline"}</div>
                  </div>
                  <div
                    className={`w-3 h-3 ${
                      user.isOnline ? "bg-green-500" : "bg-muted"
                    } rounded-full`}
                  ></div>
                </button>
              ))}
            </div>
          </>
        </aside>

        <aside className="absolute inset-y-0 left-64 z-10 flex w-[200px] flex-col border-r bg-gray-100">
          <div className="flex flex-col items-center gap-4 px-4 py-6 bg-gray-100">
            <div className="text-center space-y-4">
              {selectedUser ? (
                <>
                  <div className="text-xl font-bold">User details: </div>
                  <div className="font-medium">{selectedUser.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.mobileNumber}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email || 'No email'}</div>
                  <div className="text-sm text-muted-foreground">Age: {selectedUser.age}</div>
                  <div className="text-sm text-muted-foreground">Gender: {selectedUser.gender}</div>
                  <div className="text-sm text-muted-foreground">{selectedUser.isOnline ? 'Online' : 'Offline'}</div>
                  <div className="text-md text-muted-foreground">Last Location:</div>
                  <div className="text-sm text-muted-foreground">Latitude: {selectedUser.lastLocation?.latitude}</div>
                  <div className="text-sm text-muted-foreground">Longitude: {selectedUser.lastLocation?.longitude}</div>
                  <div className="text-sm text-muted-foreground">Last active: {selectedUser.lastLocation?.timestamp}</div>
                  <button 
                    className="mt-4 p-2 bg-blue-500 text-white rounded-md"
                    onClick={calculateRoute}
                  >
                    Get Directions
                  </button>
                </>
              ) : (
                <div>No user selected</div>
              )}
            </div>
          </div>
        </aside>

        <div className="absolute right-4 p-6 sm:p-8 md:p-10 ml-2">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={10}
              onLoad={onLoad}
              onUnmount={onUnmount}
            >
              {/* Show directions on the map */}
              {directionsResponse && (
                <DirectionsRenderer
                  directions={directionsResponse}
                />
              )}
            </GoogleMap>
          ) : (
            <div>Loading Map...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
