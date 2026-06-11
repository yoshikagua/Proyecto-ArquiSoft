use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use reqwest::Client;
use serde::Deserialize;

use crate::errors::app_error::AppError;

const GOOGLE_JWKS_URL: &str = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUERS: [&str; 2] = ["https://accounts.google.com", "accounts.google.com"];

#[derive(Debug, Clone)]
pub struct GoogleAuthService {
    client: Client,
    client_id: String,
}

#[derive(Debug, Deserialize)]
pub struct GoogleClaims {
    pub email: String,
    pub email_verified: bool,
    pub given_name: Option<String>,
    pub family_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GoogleJwks {
    keys: Vec<GoogleJwk>,
}

#[derive(Debug, Deserialize)]
struct GoogleJwk {
    kid: String,
    n: String,
    e: String,
}

impl GoogleAuthService {
    pub fn new(client_id: String) -> Self {
        Self {
            client: Client::new(),
            client_id,
        }
    }

    /// Verifica el ID token (JWT) emitido por Google contra las claves públicas
    /// publicadas en GOOGLE_JWKS_URL y valida audiencia/emisor/expiración.
    pub async fn verify(&self, id_token: &str) -> Result<GoogleClaims, AppError> {
        let header = decode_header(id_token).map_err(|_| AppError::Unauthorized)?;
        let kid = header.kid.ok_or(AppError::Unauthorized)?;

        let jwks: GoogleJwks = self
            .client
            .get(GOOGLE_JWKS_URL)
            .send()
            .await
            .map_err(|_| AppError::Unauthorized)?
            .json()
            .await
            .map_err(|_| AppError::Unauthorized)?;

        let jwk = jwks
            .keys
            .iter()
            .find(|k| k.kid == kid)
            .ok_or(AppError::Unauthorized)?;

        let decoding_key = DecodingKey::from_rsa_components(&jwk.n, &jwk.e)
            .map_err(|_| AppError::Unauthorized)?;

        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_audience(&[&self.client_id]);
        validation.set_issuer(&GOOGLE_ISSUERS);

        let token_data = decode::<GoogleClaims>(id_token, &decoding_key, &validation)
            .map_err(|_| AppError::Unauthorized)?;

        if !token_data.claims.email_verified {
            return Err(AppError::Unauthorized);
        }

        Ok(token_data.claims)
    }
}
