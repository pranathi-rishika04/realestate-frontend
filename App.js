import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [properties, setProperties] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const [searchBhk, setSearchBhk] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  
  const [showForm, setShowForm] = useState(false);
  const [newProperty, setNewProperty] = useState({ title: '', description: '', price: '', city: '', bhk: '', imageUrl: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch('/api/properties')
      .then(response => response.json())
      .then(data => setProperties(data));
  }, []);

  const filteredProperties = properties.filter((prop) => {
    const matchesCity = prop.city.toLowerCase().includes(searchCity.toLowerCase());
    const matchesBhk = searchBhk === "" || prop.bhk === parseInt(searchBhk);
    const matchesPrice = maxPrice === "" || prop.price <= Number(maxPrice);
    return matchesCity && matchesBhk && matchesPrice;
  });

  const openModal = (prop) => setSelectedProperty(prop);
  const closeModal = () => setSelectedProperty(null);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      await fetch(`/api/properties/${id}`, { method: 'DELETE' });
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return null;
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      alert("Upload failed: " + errorText);
      return null;
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const imageUrl = await handleImageUpload();
    if (!imageUrl) return alert("Please select an image!");

    const propertyToSend = {
      ...newProperty,
      price: parseFloat(newProperty.price),
      bhk: parseInt(newProperty.bhk),
      imageUrl: imageUrl
    };

    const response = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyToSend)
    });

    const savedProperty = await response.json();
    setProperties([...properties, savedProperty]);
    resetForm();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    let imageUrl = newProperty.imageUrl;
    if (selectedFile) {
      const newImageUrl = await handleImageUpload();
      if (!newImageUrl) return alert("Image upload failed!");
      imageUrl = newImageUrl;
    }

    const propertyToSend = {
      ...newProperty,
      price: parseFloat(newProperty.price),
      bhk: parseInt(newProperty.bhk),
      imageUrl: imageUrl
    };

    const response = await fetch(`/api/properties/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(propertyToSend)
    });

    const updatedProperty = await response.json();
    setProperties(properties.map(p => p.id === editingId ? updatedProperty : p));
    resetForm();
  };

  const startEdit = (prop) => {
    setEditingId(prop.id);
    setNewProperty({
      title: prop.title,
      description: prop.description,
      price: prop.price.toString(),
      city: prop.city,
      bhk: prop.bhk.toString(),
      imageUrl: prop.imageUrl
    });
    setSelectedFile(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewProperty({ title: '', description: '', price: '', city: '', bhk: '', imageUrl: '' });
    setSelectedFile(null);
  };

  return (
    <div className="app-container">
      <div className="header-row">
        <h1 className="header">🏠 Real Estate Platform</h1>
        <button className="add-btn" onClick={() => {
          if(showForm) resetForm();
          else setShowForm(true);
        }}>
          {showForm ? "Cancel" : "+ Add New Property"}
        </button>
      </div>
      
      {showForm && (
        <div className="form-container">
          <h2>{editingId ? "Edit Property" : "Add a New Property"}</h2>
          <form onSubmit={editingId ? handleUpdate : handleSubmit}>
            <input type="text" placeholder="Title (e.g., Beautiful Villa)" required value={newProperty.title} onChange={(e) => setNewProperty({...newProperty, title: e.target.value})} />
            <textarea placeholder="Description" required value={newProperty.description} onChange={(e) => setNewProperty({...newProperty, description: e.target.value})} />
            <div className="form-row">
              <input type="number" placeholder="Price per month" required value={newProperty.price} onChange={(e) => setNewProperty({...newProperty, price: e.target.value})} />
              <input type="text" placeholder="City" required value={newProperty.city} onChange={(e) => setNewProperty({...newProperty, city: e.target.value})} />
              <input type="number" placeholder="BHK" required value={newProperty.bhk} onChange={(e) => setNewProperty({...newProperty, bhk: e.target.value})} />
            </div>
            <input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files[0])} />
            <p style={{fontSize: '12px', color: 'gray'}}>{editingId ? "Leave empty to keep the current image." : "Please select an image."}</p>
            <button type="submit" className="submit-btn">
              {editingId ? "Save Changes" : "Upload & Save Property"}
            </button>
          </form>
        </div>
      )}

      <div className="search-container">
        <input type="text" placeholder="Search by City" className="search-input" value={searchCity} onChange={(e) => setSearchCity(e.target.value)} />
        <input type="number" placeholder="BHK" className="search-input bhk-input" value={searchBhk} onChange={(e) => setSearchBhk(e.target.value)} />
        <input type="number" placeholder="Max Price" className="search-input" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      </div>
      
      <div className="property-grid">
        {filteredProperties.length > 0 ? (
          filteredProperties.map((prop) => (
            <div key={prop.id} className="property-card">
              <img src={prop.imageUrl} alt={prop.title} className="card-image" />
              <div className="card-content">
                <h2>{prop.title}</h2>
                <p className="location">{prop.city} • {prop.bhk} BHK</p>
                <p className="price">₹{prop.price.toLocaleString()} / month</p>
                <p className="description">{prop.description}</p>
                <div className="card-buttons">
                  <button className="btn-view" onClick={() => openModal(prop)}>View Details</button>
                  <button className="btn-edit" onClick={() => startEdit(prop)} style={{backgroundColor: "#ffc107", color: "black", border: "none", padding: "8px 12px", borderRadius: "4px", cursor: "pointer"}}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(prop.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <h2 className="no-results">No properties found.</h2>
        )}
      </div>
            
      {selectedProperty && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>X</button>
            <img src={selectedProperty.imageUrl} alt={selectedProperty.title} className="modal-image" />
            <h2>{selectedProperty.title}</h2>
            <p className="location">{selectedProperty.city} • {selectedProperty.bhk} BHK</p>
            <p className="price">₹{selectedProperty.price.toLocaleString()} / month</p>
            <p className="description">{selectedProperty.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;