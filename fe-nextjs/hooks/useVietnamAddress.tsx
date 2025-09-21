import { useState, useCallback } from "react";
import { Province } from "@/types/patient";
import { Commune } from "@/types/patient";
import { Api } from "@/configs/api";
import axios from "axios";


export const useVietnamAddress = () => {

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [communesOfProvince, setCommunesOfProvince] = useState<Commune[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [loadingCommunes, setLoadingCommunes] = useState(false);

    const getProvinces = useCallback(async () => {
        if (loadingProvinces || provinces.length > 0) return; // Prevent multiple calls
        
        setLoadingProvinces(true);
        try {
            const response = await axios.get(Api.ThirdParty.VietnamAddress.GET_PROVINCES);
            console.log('response', response.data);
            const data = Array.isArray(response.data.provinces) ? response.data.provinces : [];
            setProvinces(data);
        } 
        catch (error) {
            console.error('Error fetching provinces:', error);
            setProvinces([]);
        }
        finally {
            setLoadingProvinces(false);
        }
    }, [loadingProvinces, provinces.length]);
    
    
    const getCommunesOfProvince = useCallback(async (provinceId: string) => {
        if (loadingCommunes) return; // Prevent multiple calls
        
        setLoadingCommunes(true);
        try {
            const response = await axios.get(
                Api.ThirdParty.VietnamAddress.GET_COMMUNES_FROM_PROVINCE.replace('{province_id}', provinceId)
            );
            const data = Array.isArray(response.data.communes) ? response.data.communes : [];
            setCommunesOfProvince(data);
        } 
        catch (error) {
            console.error('Error fetching communes:', error);
            setCommunesOfProvince([]);
        }
        finally {
            setLoadingCommunes(false);
        }
    }, [loadingCommunes]);

    return {
        provinces,
        communesOfProvince,
        loadingProvinces,
        loadingCommunes,
        getProvinces,
        getCommunesOfProvince
    }

}
