import React, { useState, useEffect } from "react";
import {
  Button,
  Form,
  Card,
  Container,
  Row,
  Col,
  Alert,
  Spinner,
} from "react-bootstrap";
import { PlusCircle, Pencil, Trash2, Image as ImageIcon, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Kos = () => {
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const API_URL_IMAGE = import.meta.env.VITE_APP_API_URL_IMAGE;
  const navigate = useNavigate();

  const [kosData, setKosData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nama_kos: "",
    pemilik_kos: "",
    alamat_kos: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchKosData();
  }, []);

  const fetchKosData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/kos`);
      const data = response.data?.data || [];

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from server");
      }

      setKosData(data);
      setError("");
    } catch (err) {
      console.error("Error fetching kos data:", err);
      setKosData([]);
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ["nama_kos", "pemilik_kos", "alamat_kos", "description"];

    requiredFields.forEach((field) => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${field.replace("_", " ").toUpperCase()} is required`;
      }
    });

    if (!editingId && selectedFiles.length === 0) {
      newErrors.image = "At least one image is required for new entries";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    const validFiles = files.filter((file) => {
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      const isValidType = ["image/jpeg", "image/png", "image/jpg"].includes(file.type);
      return isValidSize && isValidType;
    });

    if (validFiles.length !== files.length) {
      setErrors((prev) => ({
        ...prev,
        image: "Some files were skipped. Images must be JPG/PNG and under 5MB",
      }));
    }

    setSelectedFiles(validFiles);
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    selectedFiles.forEach((file) => {
      formDataToSend.append("image", file);
    });

    try {
      setIsLoading(true);
      if (editingId) {
        await axios.put(`${API_URL}/api/kos/${editingId}`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`${API_URL}/api/kos`, formDataToSend, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchKosData();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setIsLoading(true);
      await axios.delete(`${API_URL}/api/kos/${id}`);
      await fetchKosData();
      setShowConfirmDelete(false);
      setDeleteId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      nama_kos: item.nama_kos,
      pemilik_kos: item.pemilik_kos,
      alamat_kos: item.alamat_kos,
      description: item.description,
    });
    setImagePreviews(item.image || []);
    setIsAddMode(true);
  };

  const handleAddRoom = (kosId) => {
    // Navigate to kamar page with kosId in both query params and state
    navigate(`/kamars`, {
      search: `?kosId=${kosId}`,
      state: { kosId }
    });
  };

  const resetForm = () => {
    setFormData({
      nama_kos: "",
      pemilik_kos: "",
      alamat_kos: "",
      description: "",
    });
    setSelectedFiles([]);
    setImagePreviews([]);
    setIsAddMode(false);
    setEditingId(null);
    setError("");
    setErrors({});
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{editingId ? "Edit Kos" : "Kos List"}</h2>
        {!isAddMode && (
          <Button
            variant="primary"
            onClick={() => setIsAddMode(true)}
            className="d-flex align-items-center gap-2"
          >
            <PlusCircle size={20} />
            Add New Kos
          </Button>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {isAddMode ? (
        <Card className="mb-4">
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nama Kos</Form.Label>
                    <Form.Control
                      type="text"
                      name="nama_kos"
                      value={formData.nama_kos}
                      onChange={handleInputChange}
                      isInvalid={!!errors.nama_kos}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.nama_kos}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Pemilik Kos</Form.Label>
                    <Form.Control
                      type="text"
                      name="pemilik_kos"
                      value={formData.pemilik_kos}
                      onChange={handleInputChange}
                      isInvalid={!!errors.pemilik_kos}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.pemilik_kos}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Alamat Kos</Form.Label>
                <Form.Control
                  type="text"
                  name="alamat_kos"
                  value={formData.alamat_kos}
                  onChange={handleInputChange}
                  isInvalid={!!errors.alamat_kos}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.alamat_kos}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  isInvalid={!!errors.description}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.description}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Images</Form.Label>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <Button
                    variant="outline-secondary"
                    onClick={() => document.getElementById("image-upload").click()}
                    className="d-flex align-items-center gap-2"
                  >
                    <ImageIcon size={20} />
                    {editingId ? "Change Images" : "Upload Images"}
                  </Button>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="position-relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{
                          height: "80px",
                          width: "80px",
                          objectFit: "cover",
                        }}
                        className="rounded"
                      />
                    </div>
                  ))}
                </div>
                <Form.Control
                  id="image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageChange}
                  multiple
                  className="d-none"
                />
                {errors.image && (
                  <div className="text-danger mt-1 small">{errors.image}</div>
                )}
              </Form.Group>

              <div className="d-flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {kosData.map((item) => (
            <Col key={item.id}>
              <Card>
                <div className="position-relative">
                  {item.image && item.image.length > 0 && (
                    <img
                      src={`${API_URL_IMAGE}${item.image[0]}`}
                      alt={item.nama_kos}
                      style={{
                        width: "100%",
                        height: "200px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </div>
                <Card.Body>
                  <Card.Title>{item.nama_kos}</Card.Title>
                  <Card.Text>
                    <strong>Pemilik:</strong> {item.pemilik_kos}
                    <br />
                    <strong>Alamat:</strong> {item.alamat_kos}
                    <br />
                    <strong>Description:</strong> {item.description}
                  </Card.Text>
                  <div className="d-flex gap-2 flex-wrap">
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleAddRoom(item.id)}
                      className="d-flex align-items-center gap-1"
                    >
                      <Home size={16} />
                      Add Room
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEdit(item)}
                      className="d-flex align-items-center gap-1"
                    >
                      <Pencil size={16} />
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => {
                        setDeleteId(item.id);
                        setShowConfirmDelete(true);
                      }}
                      className="d-flex align-items-center gap-1"
                    >
                      <Trash2 size={16} />
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {showConfirmDelete && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <Card style={{ width: "300px" }}>
            <Card.Body>
              <Card.Title>Confirm Delete</Card.Title>
              <Card.Text>Are you sure you want to delete this item?</Card.Text>
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setDeleteId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(deleteId)}
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
};

export default Kos;