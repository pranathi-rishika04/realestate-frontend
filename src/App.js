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
    fetch('https://realestate-backend-6p82.onrender.com/api/properties')
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
      await fetch(`https://realestate-backend-6p82.onrender.com/api/properties/${id}`, { method: 'DELETE' });
      setProperties(properties.filter(p => p.id !== id));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return null;
    
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch('https://realestate-backend-6p82.onrender.com/api/upload', {
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

    const response = await fetch('https://realestate-backend-6p82.onrender.com/api/properties', {
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

    const response = await fetch(`https://realestate-backend-6p82.onrender.com/api/properties/${editingId}`, {
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

    {/* HERO SECTION */}
    <div className="hero-section">
      <div className="hero-overlay">
        <h1 className="hero-title">Find Your Dream Home</h1>
        <p className="hero-subtitle">
          Discover premium properties with modern living spaces.
        </p>

        <button
          className="hero-btn"
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
        >
          {showForm ? "Cancel" : "+ Add New Property"}
        </button>
      </div>
    </div>

    {/* SEARCH PANEL */}
    <div className="search-wrapper">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by City"
          className="search-input"
          value={searchCity}
          onChange={(e) => setSearchCity(e.target.value)}
        />

        <input
          type="number"
          placeholder="BHK"
          className="search-input"
          value={searchBhk}
          onChange={(e) => setSearchBhk(e.target.value)}
        />

        <input
          type="number"
          placeholder="Max Price"
          className="search-input"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>
    </div>

    {/* FORM SECTION */}
    {showForm && (
      <div className="form-container">
        <h2>{editingId ? "Edit Property" : "Add a New Property"}</h2>

        <form onSubmit={editingId ? handleUpdate : handleSubmit}>

          <input
            type="text"
            placeholder="Property Title"
            required
            value={newProperty.title}
            onChange={(e) =>
              setNewProperty({ ...newProperty, title: e.target.value })
            }
          />

          <textarea
            placeholder="Property Description"
            required
            value={newProperty.description}
            onChange={(e) =>
              setNewProperty({
                ...newProperty,
                description: e.target.value,
              })
            }
          />

          <div className="form-row">

            <input
              type="number"
              placeholder="Price"
              required
              value={newProperty.price}
              onChange={(e) =>
                setNewProperty({ ...newProperty, price: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="City"
              required
              value={newProperty.city}
              onChange={(e) =>
                setNewProperty({ ...newProperty, city: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="BHK"
              required
              value={newProperty.bhk}
              onChange={(e) =>
                setNewProperty({ ...newProperty, bhk: e.target.value })
              }
            />

          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />

          <button type="submit" className="submit-btn">
            {editingId ? "Save Changes" : "Upload Property"}
          </button>

        </form>
      </div>
    )}

    {/* PROPERTY SECTION */}

    <div className="section-header">
      <h2>Featured Properties</h2>
      <p>Explore the latest premium listings</p>
    </div>

    <div className="property-grid">

      {filteredProperties.length > 0 ? (

        filteredProperties.map((prop) => (

          <div key={prop.id} className="property-card">

            <div className="image-wrapper">
              <img
                src={prop.imageUrl}
                alt={prop.title}
                className="card-image"
              />

              <span className="property-badge">
                {prop.bhk} BHK
              </span>
            </div>

            <div className="card-content">

              <h2>{prop.title}</h2>

              <p className="location">
                📍 {prop.city}
              </p>

              <p className="price">
                ₹{prop.price.toLocaleString()} / month
              </p>

              <p className="description">
                {prop.description}
              </p>

              <div className="card-buttons">

                <button
                  className="btn-view"
                  onClick={() => openModal(prop)}
                >
                  View
                </button>

                <button
                  className="btn-edit"
                  onClick={() => startEdit(prop)}
                >
                  Edit
                </button>

                <button
                  className="btn-delete"
                  onClick={() => handleDelete(prop.id)}
                >
                  Delete
                </button>

              </div>

            </div>

          </div>

        ))

      ) : (

        <h2 className="no-results">
          No properties found.
        </h2>

      )}

    </div>

    {/* MODAL */}

    {selectedProperty && (

      <div className="modal-overlay" onClick={closeModal}>

        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >

          <button className="close-btn" onClick={closeModal}>
            ✕
          </button>

          <img
            src={selectedProperty.imageUrl}
            alt={selectedProperty.title}
            className="modal-image"
          />

          <div className="modal-body">

            <h2>{selectedProperty.title}</h2>

            <p className="location">
              📍 {selectedProperty.city} • {selectedProperty.bhk} BHK
            </p>

            <p className="price">
              ₹{selectedProperty.price.toLocaleString()} / month
            </p>

            <p className="description">
              {selectedProperty.description}
            </p>

          </div>

        </div>

      </div>

    )}

  </div>
);
}

export default App;
