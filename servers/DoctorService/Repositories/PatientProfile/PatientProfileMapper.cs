using Amazon.DynamoDBv2.Model;
using DoctorService.Models;

namespace DoctorService.Repositories.PatientProfile
{
    public static class DynamoMapper
    {
        // PatientProfile mapping methods
        public static Dictionary<string, AttributeValue> PatientProfileToDynamoItem(Models.PatientProfile patientProfile)
        {
            var item = new Dictionary<string, AttributeValue>
            {
                ["id"] = new AttributeValue { S = patientProfile.Id },
                ["fullname"] = new AttributeValue { S = patientProfile.Fullname },
                ["gender"] = new AttributeValue { S = patientProfile.Gender.ToString() }
            };

            if (!string.IsNullOrEmpty(patientProfile.Phone))
                item["phone"] = new AttributeValue { S = patientProfile.Phone };

            if (!string.IsNullOrEmpty(patientProfile.HouseNumber))
                item["houseNumber"] = new AttributeValue { S = patientProfile.HouseNumber };

            if (!string.IsNullOrEmpty(patientProfile.Nation))
                item["nation"] = new AttributeValue { S = patientProfile.Nation };

            if (patientProfile.Commune != null)
            {
                item["commune"] = new AttributeValue
                {
                    M = new Dictionary<string, AttributeValue>
                    {
                        ["code"] = new AttributeValue { S = patientProfile.Commune.Code },
                        ["name"] = new AttributeValue { S = patientProfile.Commune.Name },
                        ["englishName"] = new AttributeValue { S = patientProfile.Commune.EnglishName },
                        ["administrativeLevel"] = new AttributeValue { S = patientProfile.Commune.AdministrativeLevel },
                        ["provinceCode"] = new AttributeValue { S = patientProfile.Commune.ProvinceCode },
                        ["provinceName"] = new AttributeValue { S = patientProfile.Commune.ProvinceName },
                        ["decree"] = new AttributeValue { S = patientProfile.Commune.Decree }
                    }
                };
            }

            if (patientProfile.Province != null)
            {
                item["province"] = new AttributeValue
                {
                    M = new Dictionary<string, AttributeValue>
                    {
                        ["code"] = new AttributeValue { S = patientProfile.Province.Code },
                        ["name"] = new AttributeValue { S = patientProfile.Province.Name },
                        ["englishName"] = new AttributeValue { S = patientProfile.Province.EnglishName },
                        ["administrativeLevel"] = new AttributeValue { S = patientProfile.Province.AdministrativeLevel },
                        ["decree"] = new AttributeValue { S = patientProfile.Province.Decree }
                    }
                };
            }

            return item;
        }

        public static Models.PatientProfile DynamoItemToPatientProfile(Dictionary<string, AttributeValue> item)
        {
            var patientProfile = new Models.PatientProfile
            {
                Id = item["id"].S,
                Fullname = item["fullname"].S,
                Gender = Enum.Parse<Gender>(item["gender"].S)
            };

            if (item.ContainsKey("phone") && !string.IsNullOrEmpty(item["phone"].S))
                patientProfile.Phone = item["phone"].S;

            if (item.ContainsKey("houseNumber") && !string.IsNullOrEmpty(item["houseNumber"].S))
                patientProfile.HouseNumber = item["houseNumber"].S;

            if (item.ContainsKey("nation") && !string.IsNullOrEmpty(item["nation"].S))
                patientProfile.Nation = item["nation"].S;

            if (item.ContainsKey("commune") && item["commune"].M != null)
            {
                var communeMap = item["commune"].M;
                patientProfile.Commune = new Commune
                {
                    Code = communeMap["code"].S,
                    Name = communeMap["name"].S,
                    EnglishName = communeMap["englishName"].S,
                    AdministrativeLevel = communeMap["administrativeLevel"].S,
                    ProvinceCode = communeMap["provinceCode"].S,
                    ProvinceName = communeMap["provinceName"].S,
                    Decree = communeMap["decree"].S
                };
            }

            if (item.ContainsKey("province") && item["province"].M != null)
            {
                var provinceMap = item["province"].M;
                patientProfile.Province = new Province
                {
                    Code = provinceMap["code"].S,
                    Name = provinceMap["name"].S,
                    EnglishName = provinceMap["englishName"].S,
                    AdministrativeLevel = provinceMap["administrativeLevel"].S,
                    Decree = provinceMap["decree"].S
                };
            }

            return patientProfile;
        }
    }
}

