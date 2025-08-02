import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useProperty } from '../contexts/PropertyContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { toast } from 'sonner';

const propertySchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  price: z.number().positive('El precio debe ser un número positivo'),
  address: z.string().min(5, 'La dirección es requerida'),
  city: z.string().min(3, 'La ciudad es requerida'),
  state: z.string().min(3, 'El estado es requerido'),
  zip_code: z.string().optional(),
  bedrooms: z.number().int().min(0, 'El número de habitaciones no puede ser negativo'),
  bathrooms: z.number().min(0, 'El número de baños no puede ser negativo'),
  square_feet: z.number().positive('El área debe ser un número positivo'),
  property_type: z.enum(['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial']),
  images: z.array(z.string().url('URL de imagen inválida')).optional(),
  features: z.array(z.string()).optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

const CreateProperty: React.FC = () => {
  const navigate = useNavigate();
  const { createProperty } = useProperty();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  const onSubmit = async (data: PropertyFormData) => {
    setIsLoading(true);
    try {
      await createProperty(data);
      toast.success('Propiedad creada exitosamente');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al crear la propiedad', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Crear Nueva Propiedad</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Título"
                {...register('title')}
                error={errors.title?.message}
                placeholder="Ej: Hermosa casa con vista al mar"
              />

              <Textarea
                label="Descripción"
                {...register('description')}
                error={errors.description?.message}
                placeholder="Describe los detalles de la propiedad..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Precio"
                  type="number"
                  {...register('price', { valueAsNumber: true })}
                  error={errors.price?.message}
                  placeholder="250000"
                />
                <Input
                  label="Área (m²)"
                  type="number"
                  {...register('square_feet', { valueAsNumber: true })}
                  error={errors.square_feet?.message}
                  placeholder="150"
                />
              </div>

              <Input
                label="Dirección"
                {...register('address')}
                error={errors.address?.message}
                placeholder="Calle Falsa 123"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Ciudad"
                  {...register('city')}
                  error={errors.city?.message}
                  placeholder="Ciudad Gótica"
                />
                <Input
                  label="Estado/Provincia"
                  {...register('state')}
                  error={errors.state?.message}
                  placeholder="Provincia Central"
                />
                <Input
                  label="Código Postal"
                  {...register('zip_code')}
                  error={errors.zip_code?.message}
                  placeholder="12345"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Habitaciones"
                  type="number"
                  {...register('bedrooms', { valueAsNumber: true })}
                  error={errors.bedrooms?.message}
                  placeholder="3"
                />
                <Input
                  label="Baños"
                  type="number"
                  step="0.5"
                  {...register('bathrooms', { valueAsNumber: true })}
                  error={errors.bathrooms?.message}
                  placeholder="2.5"
                />
                <Select
                  label="Tipo de Propiedad"
                  {...register('property_type')}
                  error={errors.property_type?.message}
                  options={[
                    { value: 'house', label: 'Casa' },
                    { value: 'apartment', label: 'Apartamento' },
                    { value: 'condo', label: 'Condominio' },
                    { value: 'townhouse', label: 'Adosado' },
                    { value: 'land', label: 'Terreno' },
                    { value: 'commercial', label: 'Comercial' },
                  ]}
                />
              </div>

              {/* TODO: Implementar carga de imágenes y características */}

              <div className="flex justify-end">
                <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                  {isLoading ? 'Creando...' : 'Crear Propiedad'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProperty;