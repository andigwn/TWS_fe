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
import {
  PlusCircle,
  Pencil,
  Trash2,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";

const Kamar = () => {
  const API_URL = import.meta.env.VITE_APP_API_URL;
  const API_URL_IMAGE = import.meta.env.VITE_APP_API_URL_IMAGE;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const kosId = searchParams.get("kosId") || location.state?.kosId;

  const [kamarData, setKamarData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddMode, setIsAddMode] = useState(location.pathname.includes("/add"));
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nomor_kamar: "",
    harga: "",
    fasilitas: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    if (kosId && !isAddMode) {
      fetchKamarData();
    } else if (!kosId && !isAddMode) {
      setError("No Kos ID provided");
      setIsLoading(false);
    }
  }, [kosId, isAddMode]);

  const fetchKamarData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/api/kos/${kosId}/kamars`);
      const data = response.data?.data || [];

      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received from server");
      }

      // Clean image URLs in the fetched data
      const cleanedData = data.map(item => ({
        ...item,
        image: cleanImageUrls(item.image)
      }));

      setKamarData(cleanedData);
      setError("");
    } catch (err) {
      console.error("Error fetching room data:", err);
      setKamarData([]);
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function to clean image URLs
  const cleanImageUrls = (imageData) => {
    try {
      if (!imageData) return [];
      const images = Array.isArray(imageData) ? imageData : JSON.parse(imageData);
      return images.map(img => img.replace(/['"\\]/g, ''));
    } catch (error) {
      console.error('Error cleaning image URLs:', error);
      return [];
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nomor_kamar?.trim()) {
      newErrors.nomor_kamar = "Room number is required";
    }
    if (!formData.harga?.trim()) {
      newErrors.harga = "Price is required";
    } else if (isNaN(formData.harga) || Number(formData.harga) <= 0) {
      newErrors.harga = "Price must be a valid positive number";
    }
    if (!formData.fasilitas?.trim()) {
      newErrors.fasilitas = "Facilities are required";
    }
    if (!editingId && selectedFiles.length === 0) {
      newErrors.image = "At least one image is required";
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
        await axios.put(
          `${API_URL}/api/kos/${kosId}/kamars/${editingId}`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        await axios.post(
          `${API_URL}/api/kos/${kosId}/kamars`,
          formDataToSend,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      }
      navigate(`/kamars?kosId=${kosId}`);
      await fetchKamarData();
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
      await axios.delete(`${API_URL}/api/kos/${kosId}/kamars/${id}`);
      await fetchKamarData();
      setShowConfirmDelete(false);
      setDeleteId(null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete room");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      nomor_kamar: item.nomor_kamar,
      harga: item.harga.toString(),
      fasilitas: item.fasilitas,
    });

    // Handle image previews for editing
    const cleanedImages = cleanImageUrls(item.image);
    const previewUrls = cleanedImages.map(img => `${API_URL_IMAGE}${img}`);
    setImagePreviews(previewUrls);
    setIsAddMode(true);
  };

  const resetForm = () => {
    setFormData({
      nomor_kamar: "",
      harga: "",
      fasilitas: "",
    });
    setSelectedFiles([]);
    setImagePreviews([]);
    setIsAddMode(false);
    setEditingId(null);
    setError("");
    setErrors({});
  };

  const renderForm = () => (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4 className="mb-0">{editingId ? "Edit Room" : "Add New Room"}</h4>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => {
            navigate(`/kamars?kosId=${kosId}`);
            resetForm();
          }}
          className="d-flex align-items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to List
        </Button>
      </Card.Header>
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Room Number</Form.Label>
                <Form.Control
                  type="text"
                  name="nomor_kamar"
                  value={formData.nomor_kamar}
                  onChange={handleInputChange}
                  isInvalid={!!errors.nomor_kamar}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.nomor_kamar}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Price</Form.Label>
                <Form.Control
                  type="number"
                  name="harga"
                  value={formData.harga}
                  onChange={handleInputChange}
                  isInvalid={!!errors.harga}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.harga}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Facilities</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="fasilitas"
              value={formData.fasilitas}
              onChange={handleInputChange}
              isInvalid={!!errors.fasilitas}
            />
            <Form.Control.Feedback type="invalid">
              {errors.fasilitas}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Room Images</Form.Label>
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
                "Save Room"
              )}
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                navigate(`/kamars?kosId=${kosId}`);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );

  const renderList = () => (
    <>
      <Row xs={1} md={2} lg={3} className="g-4">
        {kamarData.map((item) => (
          <Col key={item.id}>
            <Card>
              <div className="position-relative">
                {item.image && item.image.length > 0 && (
                  <img
                    src={`${API_URL_IMAGE}${item.image[0]}`}
                    alt={item.nomor_kamar}
                    style={{
                      width: "100%",
                      height: "200px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      console.error("Image load error:", e);
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                )}
              </div>
              <Card.Body>
                <Card.Title>Room {item.nomor_kamar}</Card.Title>
                <Card.Text>
                  <strong>Price:</strong>{" "}
                  {parseInt(item.harga).toLocaleString("id-ID", {
                    style: "currency",
                    currency: "IDR",
                  })}
                  <br />
                  <strong>Facilities:</strong> {item.fasilitas}
                </Card.Text>
                <div className="d-flex gap-2">
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

      {showConfirmDelete && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
        >
          <Card style={{ width: "300px" }}>
            <Card.Body>
              <Card.Title>Confirm Delete</Card.Title>
              <Card.Text>Are you sure you want to delete this room?</Card.Text>
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
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </>
  );

  return (
    <Container className="py-4">
      {error && <Alert variant="danger">{error}</Alert>}

      {!kosId && !isAddMode ? (
        <Alert variant="warning">
          Please select a Kos first to view its rooms
        </Alert>
      ) : isAddMode ? (
        renderForm()
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Room List</h2>
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => navigate("/kos")}
                className="d-flex align-items-center gap-2"
              >
                <ArrowLeft size={20} />
                Back to Kos
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setIsAddMode(true);
                  navigate(`/kamars?kosId=${kosId}`);
                }}
                className="d-flex align-items-center gap-2"
              >
                <PlusCircle size={20} />
                Add New Room
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading rooms...</p>
            </div>
          ) : kamarData.length === 0 ? (
            <Alert variant="info">
              No rooms found. Click "Add New Room" to create one.
            </Alert>
          ) : (
            renderList()
          )}
        </>
      )}
    </Container>
  );
};

export default Kamar;