import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Search, 
  Filter,
  Navigation,
  ExternalLink,
  Star,
  Users,
  Heart
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PHC {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  services: string[] | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  created_at: string;
}

const PHCDirectory = () => {
  const { user } = useAuth();
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedService, setSelectedService] = useState('all');

  const services = [
    'General Medicine',
    'Gynecology',
    'Mental Health',
    'Nutrition Counseling',
    'Maternal Health',
    'Community Health',
    'Emergency Care',
    'Vaccination',
    'Family Planning',
    'Health Education'
  ];

  useEffect(() => {
    fetchPHCs();
  }, []);

  const fetchPHCs = async () => {
    try {
      const { data, error } = await supabase
        .from('phc_directory')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setPhcs(data || []);
    } catch (error) {
      console.error('Error fetching PHCs:', error);
      toast.error('Failed to fetch PHC directory');
    } finally {
      setLoading(false);
    }
  };

  const filteredPHCs = phcs.filter(phc => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = (phc.name ?? '').toLowerCase().includes(term) ||
                         (phc.address ?? '').toLowerCase().includes(term) ||
                         (phc.city ?? '').toLowerCase().includes(term);
    
    const matchesCity = selectedCity === 'all' || phc.city === selectedCity;
    const matchesService = selectedService === 'all' || (phc.services ?? []).includes(selectedService);
    
    return matchesSearch && matchesCity && matchesService;
  });

  const cities = Array.from(new Set(phcs.map(phc => phc.city).filter(Boolean))).sort();

  const getDirections = (phc: PHC) => {
    if (phc.latitude && phc.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${phc.latitude},${phc.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      toast.info('Directions not available for this location');
    }
  };

  const callPHC = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const emailPHC = (email: string) => {
    window.open(`mailto:${email}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Primary Health Centers</h2>
        <p className="text-gray-600">Find nearby healthcare facilities and services</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, address, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="Select Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {filteredPHCs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No PHCs Found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or check back later for more locations.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredPHCs.map((phc) => (
            <motion.div
              key={phc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        {phc.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {phc.address}, {phc.city}, {phc.state} - {phc.pincode}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Services */}
                    <div>
                      <h4 className="font-medium mb-2">Available Services</h4>
                      <div className="flex flex-wrap gap-2">
                        {(phc.services ?? []).length > 0 ? (
                          (phc.services ?? []).map((service, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {service}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Not listed</span>
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {phc.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{phc.phone}</span>
                        </div>
                      )}
                      {phc.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{phc.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      {phc.phone && (
                        <Button
                          size="sm"
                          onClick={() => callPHC(phc.phone)}
                          className="flex items-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </Button>
                      )}
                      {phc.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => emailPHC(phc.email)}
                          className="flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getDirections(phc)}
                        className="flex items-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        Directions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Statistics */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{phcs.length}</div>
              <div className="text-sm text-gray-600">Total PHCs</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{cities.length}</div>
              <div className="text-sm text-gray-600">Cities Covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{services.length}</div>
              <div className="text-sm text-gray-600">Services Available</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PHCDirectory;
